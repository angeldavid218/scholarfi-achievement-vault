import { useState } from "react";
import type { CourseSummary } from "../../types/achievement";
import { FormField } from "../ui/FormField";
import { IconPlusCircle, IconTrash } from "../ui/icons";

interface CoursesPanelProps {
  courses: CourseSummary[];
  syncStatus: "idle" | "pending" | "ready" | "error";
  isMutating?: boolean;
  onCreateCourse: (title: string) => void | Promise<void>;
  onToggleActive: (course: CourseSummary) => void | Promise<void>;
  onCloseCourse: (course: CourseSummary) => void | Promise<void>;
}

export const CoursesPanel = ({
  courses,
  syncStatus,
  isMutating = false,
  onCreateCourse,
  onToggleActive,
  onCloseCourse,
}: CoursesPanelProps) => {
  const [titleDraft, setTitleDraft] = useState("");

  const handleCreate = async () => {
    const title = titleDraft.trim();
    if (!title) {
      window.alert("Ingresa un título para el curso.");
      return;
    }
    await onCreateCourse(title);
    setTitleDraft("");
  };

  return (
    <section className="vault-panel card border border-base-300/80 bg-base-100/90 shadow-sm backdrop-blur-sm">
      <div className="card-body gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral">
            Cursos
          </p>
          <h2 className="text-lg font-semibold text-base-content">Cursos del vault</h2>
          <p className="text-sm text-neutral">
            Los logros pueden vincularse opcionalmente a un curso activo.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <FormField id="course-title" label="Nuevo curso">
              <input
                id="course-title"
                className="input input-bordered w-full"
                placeholder="ej. Matemáticas 101"
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
              />
            </FormField>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm gap-2"
            disabled={isMutating || syncStatus === "pending"}
            onClick={() => void handleCreate()}
          >
            <IconPlusCircle className="size-4" />
            Crear curso
          </button>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-box border border-dashed border-base-300 px-4 py-6 text-center text-sm text-neutral">
            Sin cursos aún. Crea uno para poder vincular logros.
          </div>
        ) : (
          <ul className="space-y-2">
            {courses.map((course) => (
              <li
                key={course.pda}
                className="flex flex-wrap items-center justify-between gap-3 rounded-box border border-base-300/70 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-medium text-base-content">
                      {course.title}
                    </p>
                    <span
                      className={`badge badge-sm ${course.active ? "badge-primary" : "badge-ghost"}`}
                    >
                      {course.active ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-xs text-neutral">ID {course.id}</p>
                  {course.explorerAddressUrl ? (
                    <a
                      className="link link-primary text-xs break-all"
                      href={course.explorerAddressUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PDA: {course.pda}
                    </a>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    disabled={isMutating}
                    onClick={() => void onToggleActive(course)}
                  >
                    {course.active ? "Desactivar" : "Activar"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-square btn-sm text-neutral"
                    aria-label={`Cerrar curso ${course.title}`}
                    disabled={isMutating}
                    onClick={() => {
                      const ok = window.confirm(
                        "Esto cerrará el curso en cadena y devolverá el rent. ¿Continuar?",
                      );
                      if (ok) void onCloseCourse(course);
                    }}
                  >
                    <IconTrash className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};
