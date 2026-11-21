import { useMemo, useState } from "react";
import type { StudentSummary } from "../../types/achievement";
import { FormField } from "../ui/FormField";
import { IconUser } from "../ui/icons";

interface StudentAssignInputProps {
  id: string;
  label: string;
  placeholder: string;
  students: StudentSummary[];
  draft: string;
  selected: StudentSummary | null;
  onDraftChange: (value: string) => void;
  onSelect: (student: StudentSummary) => void;
}

export const StudentAssignInput = ({
  id,
  label,
  placeholder,
  students,
  draft,
  selected,
  onDraftChange,
  onSelect,
}: StudentAssignInputProps) => {
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const needle = draft.trim().toLowerCase();
    if (!needle) return students.slice(0, 5);
    return students.filter(
      (student) =>
        student.displayName.toLowerCase().includes(needle) ||
        student.id.toLowerCase().includes(needle),
    );
  }, [draft, students]);

  const inputValue = selected ? `${selected.displayName} · ${selected.id}` : draft;

  return (
    <FormField id={id} label={label}>
      <div className="relative">
        <div className="input input-bordered flex w-full items-center gap-2">
          <IconUser className="size-4 shrink-0 text-neutral" />
          <input
            id={id}
            autoComplete="off"
            value={inputValue}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              window.setTimeout(() => setOpen(false), 120);
            }}
            onChange={(event) => {
              onDraftChange(event.target.value);
              setOpen(true);
            }}
            placeholder={placeholder}
            className="grow border-0 bg-transparent text-sm outline-none"
          />
        </div>
        {open && !selected && matches.length > 0 ? (
          <ul className="menu border-base-300 bg-base-100 absolute z-20 mt-2 max-h-56 w-full overflow-y-auto rounded-box border p-2 shadow-lg">
            {matches.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  className="text-sm"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onSelect(student);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col text-left">
                    <span className="font-medium">{student.displayName}</span>
                    <span className="text-xs text-neutral">{student.id}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </FormField>
  );
};
