
// src/components/icons.tsx

import Image from "next/image"
import { cn } from "@/lib/utils"

export const Icons = {
  Logo: ({ className }: { className?: string }) => (
    <Image
      src="/my-logo.png"
      alt="Phyt AI Logo"
      width={160}
      height={160}
      className={cn("h-full w-full object-contain", className)}
    />
  ),
};

export const MyLogo2 = ({ className }: { className?: string }) => (
    <Image
      src="/my-logo2.png"
      alt="Phyt AI AgroAssist Logo"
      width={160}
      height={160}
      className={cn("h-full w-full object-contain", className)}
    />
);
