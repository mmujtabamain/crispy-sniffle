import { Link as LinkIcon } from "lucide-react";

interface TodoLinksPreviewProps {
  links: string[];
}

export default function TodoLinksPreview({ links }: TodoLinksPreviewProps) {
  return (
    <div className="grid gap-1">
      {links.map((link) => (
        <a key={link} href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[var(--ink-1)]">
          <LinkIcon size={13} /> {link}
        </a>
      ))}
    </div>
  );
}
