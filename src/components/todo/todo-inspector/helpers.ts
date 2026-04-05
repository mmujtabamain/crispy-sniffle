export function toTagString(tags: string[]) {
  return (tags || []).join(", ");
}

export function toLinksString(links: string[]) {
  return (links || []).join("\n");
}
