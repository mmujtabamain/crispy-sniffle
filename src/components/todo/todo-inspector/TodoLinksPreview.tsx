import { Link as LinkIcon } from "lucide-react";

interface TodoLinksPreviewProps {
  links: string[];
}

export default function TodoLinksPreview({ links }: TodoLinksPreviewProps) {
  return (
    <div className="inspector-links">
      {links.map((link) => (
        <a key={link} href={link} target="_blank" rel="noreferrer">
          <LinkIcon size={13} /> {link}
        </a>
      ))}
    </div>
  );
}
