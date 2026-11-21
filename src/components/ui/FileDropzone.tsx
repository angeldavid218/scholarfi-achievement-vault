import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { IconCloud } from "./icons";

interface FileDropzoneProps {
  id: string;
  description: ReactNode;
  accept?: string;
  fileName?: string | null;
  onFileChange: (file: File | null) => void;
}

export const FileDropzone = ({
  id,
  description,
  accept = "image/png,image/svg+xml",
  fileName,
  onFileChange,
}: FileDropzoneProps) => {
  const handleFiles = (list: FileList | null) => {
    const next = list?.[0];
    onFileChange(next ?? null);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  return (
    <label
      htmlFor={id}
      className="border-base-300 bg-base-100/60 hover:border-primary/40 flex cursor-pointer flex-col items-center gap-2 rounded-box border border-dashed px-4 py-8 text-center transition"
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
    >
      <IconCloud className="size-8 text-neutral" />
      <div className="text-sm text-neutral">{description}</div>
      {fileName ? <div className="text-primary text-xs font-medium">{fileName}</div> : null}
      <input id={id} type="file" accept={accept} className="hidden" onChange={onInputChange} />
    </label>
  );
};
