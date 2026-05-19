import { User } from "lucide-react";

export default function OwnerAvatar({
  image,
  name,
  size = "md",
}: {
  image: string | null;
  name: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-14",
    lg: "size-20",
  }[size];
  const iconSize = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  }[size];
  return (
    <div
      className={`${sizeClasses} rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/30 transition-all`}
    >
      {image ? (
        <img src={image} alt={name ?? ""} className="size-full object-cover" />
      ) : (
        <User className={`${iconSize} text-muted-foreground`} />
      )}
    </div>
  );
}
