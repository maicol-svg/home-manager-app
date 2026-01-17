"use client";

import { useState } from "react";
import ChoreForm from "@/components/turni/ChoreForm";

interface Member {
  user_id: string;
  user: { full_name: string | null; email: string };
}

interface ChoreFormWrapperProps {
  members: Member[];
  children: React.ReactNode;
}

export default function ChoreFormWrapper({ members, children }: ChoreFormWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      <ChoreForm isOpen={isOpen} onClose={() => setIsOpen(false)} members={members} />
    </>
  );
}
