import type {
  AchievementKind,
  CourseSummary,
  RecentIssuance,
  StudentSummary,
} from "../../types/achievement";
import { FormField } from "../ui/FormField";
import { IconPlusCircle, IconSparkles } from "../ui/icons";
import { StudentAssignInput } from "./StudentAssignInput";

interface CreateAchievementCardProps {
  name: string;
  kind: AchievementKind;
  selectedCourseId: string;
  studentDraft: string;
  selectedStudent: StudentSummary | null;
  recentIssuances: RecentIssuance[];
  students: StudentSummary[];
  courses: CourseSummary[];
  onNameChange: (value: string) => void;
  onKindChange: (value: AchievementKind) => void;
  onCourseChange: (courseId: string) => void;
  onStudentDraftChange: (value: string) => void;
  onStudentSelect: (student: StudentSummary) => void;
  onSubmit: () => void | Promise<void>;
  /** True while the parent is sending `register_achievement` on-chain. */
  isIssuing?: boolean;
  tokenAmount: string;
  onTokenAmountChange: (value: string) => void;
  hasRewardMint: boolean;
  rewardSymbol?: string | null;
}

export const CreateAchievementCard = ({
  name,
  kind,
  selectedCourseId,
  studentDraft,
  selectedStudent,
  recentIssuances,
  students,
  courses,
  onNameChange,
  onKindChange,
  onCourseChange,
  onStudentDraftChange,
  onStudentSelect,
  onSubmit,
  isIssuing = false,
  tokenAmount,
  onTokenAmountChange,
  hasRewardMint,
  rewardSymbol = null,
}: CreateAchievementCardProps) => {
  const activeCourses = courses.filter((course) => course.active);
  const ticker = (rewardSymbol?.trim() || "tokens").toUpperCase();

  return (
    <section className="vault-panel card border border-base-300/80 bg-base-100/90 shadow-sm backdrop-blur-sm">
      <div className="card-body gap-5">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <IconPlusCircle className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral">
              Emitir
            </p>
            <h2 className="text-lg font-semibold text-base-content">Crear logro</h2>
            <p className="text-sm text-neutral">
              Define el reconocimiento y asígnalo a un estudiante en cadena.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <FormField id="achievement-name" label="Nombre">
            <input
              id="achievement-name"
              className="input input-bordered w-full"
              placeholder="ej. Excelencia en feria de ciencias"
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="achievement-type" label="Tipo">
              <select
                id="achievement-type"
                className="select select-bordered w-full"
                value={kind}
                onChange={(event) => onKindChange(event.target.value as AchievementKind)}
              >
                <option value="nft">NFT</option>
                <option value="token">Token</option>
              </select>
            </FormField>

            <FormField id="achievement-course" label="Curso (opcional)">
              <select
                id="achievement-course"
                className="select select-bordered w-full"
                value={selectedCourseId}
                onChange={(event) => onCourseChange(event.target.value)}
              >
                <option value="">Sin curso</option>
                {activeCourses.map((course) => (
                  <option key={course.pda} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {kind === "token" ? (
            <FormField id="achievement-token-amount" label="Cantidad a enviar">
              <div className="join w-full border border-base-300 bg-base-200/70">
                <input
                  id="achievement-token-amount"
                  className="input join-item w-full border-0 bg-transparent tabular-nums focus:outline-none"
                  inputMode="numeric"
                  placeholder="ej. 10"
                  value={tokenAmount}
                  onChange={(event) => onTokenAmountChange(event.target.value)}
                />
                <span className="join-item flex items-center px-3 text-sm font-semibold text-secondary">
                  {ticker}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral">
                {hasRewardMint
                  ? "Se acuñan en la ATA del estudiante al emitir el logro."
                  : "Crea el token del aula antes de emitir un logro de tipo token."}
              </p>
            </FormField>
          ) : null}

          <StudentAssignInput
            id="achievement-student"
            label="Asignar a (ID estudiante)"
            placeholder="Buscar por nombre o ID..."
            students={students}
            draft={studentDraft}
            selected={selectedStudent}
            onDraftChange={onStudentDraftChange}
            onSelect={onStudentSelect}
          />
        </div>

        {recentIssuances.length > 0 ? (
          <div className="rounded-box border border-base-300/70 bg-base-200/40 px-3 py-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral">
              Emisiones recientes
            </p>
            <ul className="space-y-1">
              {recentIssuances.slice(0, 3).map((item) => (
                <li key={item.id} className="truncate text-sm text-base-content">
                  {item.title}
                  <span className="ml-2 text-xs text-neutral">{item.relativeTime}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          type="button"
          className="btn btn-primary gap-2 text-base"
          disabled={isIssuing}
          onClick={() => void onSubmit()}
        >
          <IconSparkles className="size-5" />
          {isIssuing ? "Emitiendo en cadena…" : "Crear y emitir"}
        </button>
      </div>
    </section>
  );
};
