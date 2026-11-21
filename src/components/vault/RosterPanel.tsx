import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import type { StudentSummary } from "../../types/achievement";
import { FormField } from "../ui/FormField";
import { IconPlusCircle, IconTrash } from "../ui/icons";

interface RosterPanelProps {
  students: StudentSummary[];
  syncStatus: "idle" | "pending" | "ready" | "error";
  isMutating?: boolean;
  onCreateList: () => void | Promise<void>;
  onAddStudent: (student: PublicKey, displayName: string) => void | Promise<void>;
  onRemoveStudent: (student: PublicKey) => void | Promise<void>;
}

export const RosterPanel = ({
  students,
  syncStatus,
  isMutating = false,
  onCreateList,
  onAddStudent,
  onRemoveStudent,
}: RosterPanelProps) => {
  const [pubkeyDraft, setPubkeyDraft] = useState("");
  const [nameDraft, setNameDraft] = useState("");

  const handleAdd = async () => {
    const trimmed = pubkeyDraft.trim();
    if (!trimmed) {
      window.alert("Ingresa la clave pública del estudiante.");
      return;
    }
    let pubkey: PublicKey;
    try {
      pubkey = new PublicKey(trimmed);
    } catch {
      window.alert("La clave pública no es válida.");
      return;
    }
    const displayName = nameDraft.trim() || `Estudiante ${trimmed.slice(0, 4)}…`;
    await onAddStudent(pubkey, displayName);
    setPubkeyDraft("");
    setNameDraft("");
  };

  return (
    <section className="vault-panel card border border-base-300/80 bg-base-100/90 shadow-sm backdrop-blur-sm">
      <div className="card-body gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral">
              Roster
            </p>
            <h2 className="text-lg font-semibold text-base-content">Lista de estudiantes</h2>
            <p className="text-sm text-neutral">
              Crea la lista en cadena y agrega o quita wallets permitidas.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={syncStatus === "pending" || isMutating}
            onClick={() => void onCreateList()}
          >
            {syncStatus === "pending"
              ? "Creando…"
              : students.length > 0
                ? "Sincronizar lista"
                : "Crear lista"}
          </button>
        </div>

        {students.length > 0 ? (
          <ul className="divide-y divide-base-300/70 rounded-box border border-base-300/70">
            {students.map((student) => (
              <li
                key={student.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-base-content">
                    {student.displayName}
                  </p>
                  <p className="truncate font-mono text-xs text-neutral">
                    {student.publicKey.toBase58()}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-square btn-sm text-neutral"
                  aria-label={`Quitar ${student.displayName}`}
                  disabled={isMutating}
                  onClick={() => void onRemoveStudent(student.publicKey)}
                >
                  <IconTrash className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-box border border-dashed border-base-300 px-4 py-6 text-center text-sm text-neutral">
            Aún no hay estudiantes en cadena. Crea la lista para comenzar.
          </div>
        )}

        {students.length > 0 || syncStatus === "ready" ? (
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <FormField id="roster-pubkey" label="Agregar estudiante (pubkey)">
              <input
                id="roster-pubkey"
                className="input input-bordered w-full font-mono text-xs"
                placeholder="Base58…"
                value={pubkeyDraft}
                onChange={(event) => setPubkeyDraft(event.target.value)}
              />
            </FormField>
            <FormField id="roster-name" label="Nombre (local)">
              <input
                id="roster-name"
                className="input input-bordered w-full"
                placeholder="ej. Ana"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
              />
            </FormField>
            <button
              type="button"
              className="btn btn-primary btn-sm gap-2 sm:col-span-2 sm:justify-self-start"
              disabled={isMutating}
              onClick={() => void handleAdd()}
            >
              <IconPlusCircle className="size-4" />
              Agregar a la lista
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
};
