import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { AchievementCatalogPanel } from "../components/achievements/AchievementCatalogPanel";
import { CreateAchievementCard } from "../components/achievements/CreateAchievementCard";
import { CoursesPanel } from "../components/vault/CoursesPanel";
import { RosterPanel } from "../components/vault/RosterPanel";
import { StatHighlight } from "../components/ui/StatHighlight";
import { SolanaWalletButton } from "../components/wallet/SolanaWalletButton";
import { IconShield } from "../components/ui/icons";
import type {
  AchievementDefinition,
  AchievementKind,
  CourseSummary,
  RecentIssuance,
  StudentSummary,
} from "../types/achievement";
import { addStudentOnChain } from "../solana/addStudentOnChain";
import { createCourseOnChain } from "../solana/createCourseOnChain";
import { createStudentListIfNeeded } from "../solana/createStudentListIfNeeded";
import { deleteAchievementOnChain } from "../solana/deleteAchievementOnChain";
import { fetchTeacherAchievements } from "../solana/fetchTeacherAchievements";
import { fetchTeacherCourses } from "../solana/fetchTeacherCourses";
import { fetchTeacherStudentList } from "../solana/fetchTeacherStudentList";
import { registerAchievementOnChain } from "../solana/registerAchievementOnChain";
import { removeStudentOnChain } from "../solana/removeStudentOnChain";
import { closeCourseOnChain, updateCourseOnChain } from "../solana/updateCourseOnChain";
import { updateAchievementOnChain } from "../solana/updateAchievementOnChain";

const LOG = "[ScholarFi Achievement Vault]";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}`;
};

const EXPLORER_CLUSTER_QUERY = "cluster=devnet";

type ChainProof = {
  label: string;
  pda: string;
  signature?: string;
};
type DeleteProof = {
  signature?: string;
  pda: string;
};
type EditModalState = {
  open: boolean;
  achievementId: string | null;
  name: string;
  kind: AchievementKind;
  courseId: string;
};

const explorerAddressUrl = (address: string) =>
  `https://explorer.solana.com/address/${address}?${EXPLORER_CLUSTER_QUERY}`;
const explorerTxUrl = (signature: string) =>
  `https://explorer.solana.com/tx/${signature}?${EXPLORER_CLUSTER_QUERY}`;

const displayNamesStorageKey = (teacher: string) => `scholarfi_student_names_${teacher}`;

function readDisplayNames(teacher: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(displayNamesStorageKey(teacher));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeDisplayNames(teacher: string, map: Record<string, string>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(displayNamesStorageKey(teacher), JSON.stringify(map));
}

function toStudentSummaries(
  pubkeys: PublicKey[],
  nameMap: Record<string, string>,
): StudentSummary[] {
  return pubkeys.map((pubkey, index) => {
    const id = pubkey.toBase58();
    return {
      id,
      displayName: nameMap[id] ?? `Estudiante #${index + 1}`,
      publicKey: pubkey,
    };
  });
}

export const AchievementLedgerPage = () => {
  const { connection } = useConnection();
  const anchorWallet = useAnchorWallet();

  const [studentList, setStudentList] = useState<StudentSummary[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [achievements, setAchievements] = useState<AchievementDefinition[]>([]);
  const [issuedCount, setIssuedCount] = useState(0);
  const [recent, setRecent] = useState<RecentIssuance[]>([]);

  const [studentListSync, setStudentListSync] = useState<"idle" | "pending" | "ready" | "error">(
    "idle",
  );
  const [coursesSync, setCoursesSync] = useState<"idle" | "pending" | "ready" | "error">("idle");
  const [achievementsSync, setAchievementsSync] = useState<"idle" | "pending" | "ready" | "error">(
    "idle",
  );
  const [rosterMutating, setRosterMutating] = useState(false);
  const [courseMutating, setCourseMutating] = useState(false);

  const [name, setName] = useState("");
  const [kind, setKind] = useState<AchievementKind>("nft");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [studentDraft, setStudentDraft] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);

  const [catalogQuery, setCatalogQuery] = useState("");
  const [isIssuingAchievement, setIsIssuingAchievement] = useState(false);
  const [lastChainProof, setLastChainProof] = useState<ChainProof | null>(null);
  const [deleteProof, setDeleteProof] = useState<DeleteProof | null>(null);
  const [isUpdatingAchievement, setIsUpdatingAchievement] = useState(false);
  const [editModal, setEditModal] = useState<EditModalState>({
    open: false,
    achievementId: null,
    name: "",
    kind: "nft",
    courseId: "",
  });

  const closeEditModal = () => {
    setEditModal({
      open: false,
      achievementId: null,
      name: "",
      kind: "nft",
      courseId: "",
    });
  };

  const syncCoursesFromChain = async (
    wallet: NonNullable<typeof anchorWallet>,
  ): Promise<CourseSummary[]> => {
    setCoursesSync("pending");
    const chainCourses = await fetchTeacherCourses(wallet, connection);
    setCourses(chainCourses);
    setCoursesSync("ready");
    return chainCourses;
  };

  const syncAchievementsFromChain = async (
    wallet: NonNullable<typeof anchorWallet>,
    courseRows?: CourseSummary[],
  ): Promise<AchievementDefinition[]> => {
    const titleById = new Map(
      (courseRows ?? courses).map((course) => [course.id, course.title] as const),
    );
    const chainAchievements = await fetchTeacherAchievements(wallet, connection, titleById);
    setAchievements(chainAchievements);
    setIssuedCount(chainAchievements.length);
    setAchievementsSync("ready");
    setRecent(
      chainAchievements.slice(0, 5).map((item) => ({
        id: item.id,
        title: item.courseTitle
          ? `${item.name} · ${item.courseTitle}`
          : item.name,
        relativeTime: "en cadena",
      })),
    );
    return chainAchievements;
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!anchorWallet?.publicKey) {
        setAchievements([]);
        setCourses([]);
        setStudentList([]);
        setIssuedCount(0);
        setRecent([]);
        setAchievementsSync("idle");
        setCoursesSync("idle");
        setStudentListSync("idle");
        return;
      }

      setAchievementsSync("pending");
      setCoursesSync("pending");
      try {
        const chainCourses = await syncCoursesFromChain(anchorWallet);
        if (cancelled) return;
        await syncAchievementsFromChain(anchorWallet, chainCourses);
        if (cancelled) return;

        try {
          const listResult = await fetchTeacherStudentList(anchorWallet, connection);
          if (cancelled) return;
          if (listResult.exists) {
            const names = readDisplayNames(anchorWallet.publicKey.toBase58());
            setStudentList(toStudentSummaries(listResult.students, names));
            setStudentListSync("ready");
          }
        } catch {
          // Leave roster idle until the teacher explicitly creates a list.
        }
      } catch (error) {
        if (cancelled) return;
        console.error(`${LOG} AchievementLedgerPage: initial sync failed`, error);
        setAchievementsSync("error");
        setCoursesSync("error");
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [anchorWallet, connection]);

  useEffect(() => {
    if (!deleteProof) return;
    const timeoutId = window.setTimeout(() => setDeleteProof(null), 25000);
    return () => window.clearTimeout(timeoutId);
  }, [deleteProof]);

  const handleCreateList = async () => {
    if (!anchorWallet?.publicKey) {
      window.alert("Conecta una billetera antes de crear la lista.");
      return;
    }

    setStudentListSync("pending");
    try {
      const result = await createStudentListIfNeeded(anchorWallet, connection, {
        studentCount: 2,
      });
      setLastChainProof({
        label: "Lista de estudiantes",
        pda: result.studentListPda.toBase58(),
        signature: result.signature,
      });
      setStudentListSync("ready");
      const names = readDisplayNames(anchorWallet.publicKey.toBase58());
      setStudentList(toStudentSummaries(result.students, names));
    } catch (e) {
      console.error(`${LOG} AchievementLedgerPage: createStudentListIfNeeded failed`, e);
      setStudentListSync("error");
      window.alert(
        "No se pudo crear la lista en cadena. Revisa la consola y tu RPC / program id.",
      );
    }
  };

  const handleAddStudent = async (student: PublicKey, displayName: string) => {
    if (!anchorWallet?.publicKey) {
      window.alert("Conecta una billetera primero.");
      return;
    }
    setRosterMutating(true);
    try {
      const result = await addStudentOnChain(anchorWallet, student, connection);
      setLastChainProof({
        label: "Estudiante agregado",
        pda: result.studentListPda.toBase58(),
        signature: result.signature,
      });
      const teacherKey = anchorWallet.publicKey.toBase58();
      const names = readDisplayNames(teacherKey);
      names[student.toBase58()] = displayName;
      writeDisplayNames(teacherKey, names);
      setStudentList((current) => {
        if (current.some((item) => item.publicKey.equals(student))) return current;
        return [
          ...current,
          { id: student.toBase58(), displayName, publicKey: student },
        ];
      });
      setStudentListSync("ready");
    } catch (error) {
      console.error(`${LOG} AchievementLedgerPage: add_student failed`, error);
      window.alert("No se pudo agregar el estudiante. ¿Ya está en la lista?");
    } finally {
      setRosterMutating(false);
    }
  };

  const handleRemoveStudent = async (student: PublicKey) => {
    if (!anchorWallet?.publicKey) {
      window.alert("Conecta una billetera primero.");
      return;
    }
    setRosterMutating(true);
    try {
      const result = await removeStudentOnChain(anchorWallet, student, connection);
      setLastChainProof({
        label: "Estudiante removido",
        pda: result.studentListPda.toBase58(),
        signature: result.signature,
      });
      setStudentList((current) => current.filter((item) => !item.publicKey.equals(student)));
    } catch (error) {
      console.error(`${LOG} AchievementLedgerPage: remove_student failed`, error);
      window.alert("No se pudo quitar el estudiante de la lista en cadena.");
    } finally {
      setRosterMutating(false);
    }
  };

  const handleCreateCourse = async (title: string) => {
    if (!anchorWallet?.publicKey) {
      window.alert("Conecta una billetera primero.");
      return;
    }
    setCourseMutating(true);
    try {
      const result = await createCourseOnChain(anchorWallet, { title }, connection);
      setLastChainProof({
        label: "Curso",
        pda: result.coursePda.toBase58(),
        signature: result.signature,
      });
      await syncCoursesFromChain(anchorWallet);
    } catch (error) {
      console.error(`${LOG} AchievementLedgerPage: create_course failed`, error);
      window.alert("No se pudo crear el curso en cadena.");
    } finally {
      setCourseMutating(false);
    }
  };

  const handleToggleCourse = async (course: CourseSummary) => {
    if (!anchorWallet?.publicKey) return;
    setCourseMutating(true);
    try {
      const result = await updateCourseOnChain(
        anchorWallet,
        {
          courseId: course.courseId,
          title: course.title,
          active: !course.active,
        },
        connection,
      );
      setLastChainProof({
        label: "Curso actualizado",
        pda: result.coursePda.toBase58(),
        signature: result.signature,
      });
      await syncCoursesFromChain(anchorWallet);
    } catch (error) {
      console.error(`${LOG} AchievementLedgerPage: update_course failed`, error);
      window.alert("No se pudo actualizar el curso.");
    } finally {
      setCourseMutating(false);
    }
  };

  const handleCloseCourse = async (course: CourseSummary) => {
    if (!anchorWallet?.publicKey) return;
    setCourseMutating(true);
    try {
      const result = await closeCourseOnChain(anchorWallet, course.courseId, connection);
      setLastChainProof({
        label: "Curso cerrado",
        pda: result.coursePda.toBase58(),
        signature: result.signature,
      });
      if (selectedCourseId === course.id) setSelectedCourseId("");
      await syncCoursesFromChain(anchorWallet);
      await syncAchievementsFromChain(anchorWallet);
    } catch (error) {
      console.error(`${LOG} AchievementLedgerPage: close_course failed`, error);
      window.alert("No se pudo cerrar el curso en cadena.");
    } finally {
      setCourseMutating(false);
    }
  };

  const filteredAchievements = useMemo(() => {
    const needle = catalogQuery.trim().toLowerCase();
    if (!needle) return achievements;
    return achievements.filter(
      (item) =>
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle) ||
        (item.courseTitle?.toLowerCase().includes(needle) ?? false),
    );
  }, [achievements, catalogQuery]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      window.alert("Agrega un nombre para el logro.");
      return;
    }
    if (!selectedStudent) {
      window.alert("Selecciona un estudiante de la lista.");
      return;
    }
    if (!anchorWallet?.publicKey) {
      window.alert("Conecta una billetera antes de emitir el logro.");
      return;
    }
    if (studentList.length === 0) {
      window.alert("Primero crea la lista de estudiantes en cadena.");
      return;
    }

    const courseId = selectedCourseId ? BigInt(selectedCourseId) : null;

    setIsIssuingAchievement(true);
    try {
      const chainResult = await registerAchievementOnChain(
        anchorWallet,
        {
          student: selectedStudent.publicKey,
          title: trimmedName,
          kind,
          courseId,
        },
        connection,
      );

      console.info(`${LOG} AchievementLedgerPage: register_achievement OK`, {
        signature: chainResult.signature ?? null,
        achievementPda: chainResult.achievementPda.toBase58(),
        achievementId: chainResult.achievementId.toString(),
        courseId: courseId?.toString() ?? null,
      });
      setLastChainProof({
        label: "Achievement",
        pda: chainResult.achievementPda.toBase58(),
        signature: chainResult.signature,
      });

      try {
        await syncAchievementsFromChain(anchorWallet);
      } catch (error) {
        console.error(
          `${LOG} AchievementLedgerPage: refresh achievements after register failed`,
          error,
        );
      }
      setRecent((items) => [
        {
          id: createId(),
          title: `${trimmedName} · ${selectedStudent.displayName}`,
          relativeTime: "justo ahora",
        },
        ...items.slice(0, 4),
      ]);

      setName("");
      setKind("nft");
      setSelectedCourseId("");
      setStudentDraft("");
      setSelectedStudent(null);
    } catch (e) {
      console.error(`${LOG} AchievementLedgerPage: register_achievement failed`, e);
      window.alert(
        "No se pudo registrar el logro en cadena. Revisa la consola, que el estudiante esté en la lista y que tengas SOL en el cluster.",
      );
    } finally {
      setIsIssuingAchievement(false);
    }
  };

  const formattedIssued = new Intl.NumberFormat("es-419").format(issuedCount);

  return (
    <div className="vault-shell text-base-content min-h-screen">
      <div className="vault-glow" aria-hidden />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 lg:px-8">
        <header className="vault-hero flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              ScholarFi Achievement Vault
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-base-content md:text-4xl">
              Bóveda de logros
            </h1>
            <p className="max-w-2xl text-base text-neutral">
              Emite, vincula y verifica credenciales académicas on-chain: roster, cursos y logros
              en una sola bóveda.
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-start sm:justify-end lg:w-auto lg:flex-col lg:items-end">
            <div className="flex flex-col items-stretch gap-1 sm:items-end">
              <SolanaWalletButton />
              {anchorWallet?.publicKey ? (
                <p className="text-xs text-neutral sm:text-right" aria-live="polite">
                  {studentListSync === "pending" && "Sincronizando lista de estudiantes…"}
                  {studentListSync === "ready" && "Lista de estudiantes lista en cadena."}
                  {studentListSync === "error" &&
                    "No se pudo sincronizar la lista. Revisa consola / RPC."}
                  {coursesSync === "pending" && " Cargando cursos…"}
                  {achievementsSync === "pending" && " Cargando logros…"}
                  {achievementsSync === "error" && " Error al cargar logros."}
                </p>
              ) : (
                <p className="text-xs text-neutral sm:text-right">
                  Conecta tu wallet de teacher para probar el vault.
                </p>
              )}
              {lastChainProof ? (
                <div className="text-xs sm:text-right">
                  <p className="text-neutral">Prueba en cadena ({lastChainProof.label}):</p>
                  <a
                    className="link link-primary break-all"
                    href={explorerAddressUrl(lastChainProof.pda)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDA: {lastChainProof.pda}
                  </a>
                  {lastChainProof.signature ? (
                    <a
                      className="link link-secondary mt-1 block break-all"
                      href={explorerTxUrl(lastChainProof.signature)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      TX: {lastChainProof.signature}
                    </a>
                  ) : (
                    <p className="mt-1 text-neutral">
                      TX: no disponible (cuenta ya existía o tx duplicada).
                    </p>
                  )}
                </div>
              ) : null}
              {deleteProof ? (
                <div className="mt-1 text-xs sm:text-right">
                  <p className="text-neutral">Eliminación en cadena:</p>
                  <a
                    className="link link-primary break-all"
                    href={explorerAddressUrl(deleteProof.pda)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Closed PDA: {deleteProof.pda}
                  </a>
                  {deleteProof.signature ? (
                    <a
                      className="link link-secondary mt-1 block break-all"
                      href={explorerTxUrl(deleteProof.signature)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      TX: {deleteProof.signature}
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
            <StatHighlight
              icon={<IconShield className="size-8" />}
              label="Emitidos"
              value={`${formattedIssued}`}
            />
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <RosterPanel
            students={studentList}
            syncStatus={studentListSync}
            isMutating={rosterMutating}
            onCreateList={handleCreateList}
            onAddStudent={handleAddStudent}
            onRemoveStudent={handleRemoveStudent}
          />
          <CoursesPanel
            courses={courses}
            syncStatus={coursesSync}
            isMutating={courseMutating}
            onCreateCourse={handleCreateCourse}
            onToggleActive={handleToggleCourse}
            onCloseCourse={handleCloseCourse}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
          <CreateAchievementCard
            name={name}
            kind={kind}
            selectedCourseId={selectedCourseId}
            studentDraft={studentDraft}
            selectedStudent={selectedStudent}
            recentIssuances={recent}
            students={studentList}
            courses={courses}
            onNameChange={setName}
            onKindChange={setKind}
            onCourseChange={setSelectedCourseId}
            onStudentDraftChange={(value) => {
              setSelectedStudent(null);
              setStudentDraft(value);
            }}
            onStudentSelect={(student) => {
              setSelectedStudent(student);
              setStudentDraft("");
            }}
            onSubmit={handleSubmit}
            isIssuing={isIssuingAchievement}
          />

          <AchievementCatalogPanel
            query={catalogQuery}
            achievements={filteredAchievements}
            onQueryChange={setCatalogQuery}
            onEdit={(id) => {
              const target = achievements.find((item) => item.id === id);
              if (!target) return;
              if (!anchorWallet?.publicKey) {
                window.alert("Conecta una billetera antes de actualizar.");
                return;
              }
              if (
                !target.sampleAchievementPda ||
                !target.deleteStudentPubkey ||
                !target.deleteAchievementId
              ) {
                window.alert(
                  "No se encontró metadata suficiente para actualizar en cadena. Recarga los logros.",
                );
                return;
              }
              setEditModal({
                open: true,
                achievementId: target.id,
                name: target.name,
                kind: target.kind,
                courseId: target.courseId ?? "",
              });
            }}
            onDelete={(id) => {
              const target = achievements.find((item) => item.id === id);
              if (!target) return;
              if (!anchorWallet?.publicKey) {
                window.alert("Conecta una billetera antes de eliminar.");
                return;
              }
              if (
                !target.sampleAchievementPda ||
                !target.deleteStudentPubkey ||
                !target.deleteAchievementId
              ) {
                window.alert(
                  "No se encontró metadata suficiente para borrar en cadena. Recarga los logros.",
                );
                return;
              }
              const confirmed = window.confirm(
                "Esto cerrará el achievement en cadena. ¿Deseas continuar?",
              );
              if (!confirmed) return;
              const sampleAchievementPda = target.sampleAchievementPda;
              const deleteStudentPubkey = target.deleteStudentPubkey;
              const deleteAchievementId = target.deleteAchievementId;
              void (async () => {
                try {
                  const result = await deleteAchievementOnChain(
                    anchorWallet,
                    {
                      student: new PublicKey(deleteStudentPubkey),
                      achievementId: BigInt(deleteAchievementId),
                      achievementPda: new PublicKey(sampleAchievementPda),
                    },
                    connection,
                  );
                  setDeleteProof({
                    pda: result.achievementPda.toBase58(),
                    signature: result.signature,
                  });
                  setLastChainProof({
                    label: "Achievement eliminado",
                    pda: result.achievementPda.toBase58(),
                    signature: result.signature,
                  });
                  await syncAchievementsFromChain(anchorWallet);
                } catch (error) {
                  console.error(`${LOG} AchievementLedgerPage: delete_achievement failed`, error);
                  window.alert(
                    "No se pudo eliminar en cadena. Revisa que esta wallet sea el teacher y que el registro exista.",
                  );
                }
              })();
            }}
          />
        </div>
      </div>

      {editModal.open ? (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Actualizar logro en cadena</h3>
            <div className="mt-4 space-y-3">
              <label className="form-control w-full">
                <span className="label-text mb-1">Nombre</span>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={editModal.name}
                  onChange={(event) =>
                    setEditModal((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Tipo</span>
                <select
                  className="select select-bordered w-full"
                  value={editModal.kind}
                  onChange={(event) =>
                    setEditModal((current) => ({
                      ...current,
                      kind: event.target.value as AchievementKind,
                    }))
                  }
                >
                  <option value="nft">NFT</option>
                  <option value="token">Token</option>
                </select>
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1">Curso (opcional)</span>
                <select
                  className="select select-bordered w-full"
                  value={editModal.courseId}
                  onChange={(event) =>
                    setEditModal((current) => ({ ...current, courseId: event.target.value }))
                  }
                >
                  <option value="">Sin curso</option>
                  {courses
                    .filter((course) => course.active || course.id === editModal.courseId)
                    .map((course) => (
                      <option key={course.pda} value={course.id}>
                        {course.title}
                        {!course.active ? " (inactivo)" : ""}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={closeEditModal}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={isUpdatingAchievement}
                onClick={() => {
                  if (!anchorWallet?.publicKey) {
                    window.alert("Conecta una billetera antes de actualizar.");
                    return;
                  }
                  const target = achievements.find((item) => item.id === editModal.achievementId);
                  if (!target) {
                    window.alert("No se encontró el logro a actualizar.");
                    return;
                  }
                  if (
                    !target.sampleAchievementPda ||
                    !target.deleteStudentPubkey ||
                    !target.deleteAchievementId
                  ) {
                    window.alert(
                      "No se encontró metadata suficiente para actualizar en cadena. Recarga los logros.",
                    );
                    return;
                  }

                  const trimmedTitle = editModal.name.trim();
                  if (!trimmedTitle) {
                    window.alert("El título no puede estar vacío.");
                    return;
                  }

                  const sampleAchievementPda = target.sampleAchievementPda;
                  const updateStudentPubkey = target.deleteStudentPubkey;
                  const updateAchievementId = target.deleteAchievementId;
                  const courseId = editModal.courseId ? BigInt(editModal.courseId) : null;
                  setIsUpdatingAchievement(true);
                  void (async () => {
                    try {
                      const result = await updateAchievementOnChain(
                        anchorWallet,
                        {
                          student: new PublicKey(updateStudentPubkey),
                          achievementId: BigInt(updateAchievementId),
                          achievementPda: new PublicKey(sampleAchievementPda),
                          title: trimmedTitle,
                          kind: editModal.kind,
                          courseId,
                        },
                        connection,
                      );

                      setLastChainProof({
                        label: "Achievement actualizado",
                        pda: result.achievementPda.toBase58(),
                        signature: result.signature,
                      });
                      await syncAchievementsFromChain(anchorWallet);
                      closeEditModal();
                      window.alert("Achievement actualizado en cadena.");
                    } catch (error) {
                      console.error(
                        `${LOG} AchievementLedgerPage: update_achievement failed`,
                        error,
                      );
                      window.alert(
                        "No se pudo actualizar en cadena. Verifica teacher wallet y datos del achievement.",
                      );
                    } finally {
                      setIsUpdatingAchievement(false);
                    }
                  })();
                }}
              >
                {isUpdatingAchievement ? "Actualizando…" : "Actualizar"}
              </button>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            className="modal-backdrop"
            onClick={closeEditModal}
          />
        </div>
      ) : null}
    </div>
  );
};
