"use client";

import { useState } from "react";
import WasteForm from "@/components/rifiuti/WasteForm";

interface WasteFormWrapperProps {
  children: React.ReactNode;
}

export default function WasteFormWrapper({ children }: WasteFormWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      <WasteForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
