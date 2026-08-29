import { useState } from "react";
import { BottomSheet } from "@/components/autovault/bottom-sheet";
import { PrimaryButton } from "@/components/autovault/buttons";
import { FormGroup, FormField, TextInput } from "@/components/autovault/form";

export function PassphraseSheet({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  onClose: () => void;
  onSubmit: (passphrase: string) => void;
}) {
  const [passphrase, setPassphrase] = useState("");

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        setPassphrase("");
        onClose();
      }}
      title={title}
      {...(description !== undefined && { description })}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!passphrase) return;
          onSubmit(passphrase);
          setPassphrase("");
        }}
        className="space-y-4"
      >
        <FormGroup>
          <FormField label="Passphrase">
            <TextInput
              type="password"
              value={passphrase}
              onChange={setPassphrase}
              placeholder="Enter passphrase"
            />
          </FormField>
        </FormGroup>
        <PrimaryButton type="submit" {...(!passphrase && { className: "opacity-50" })}>
          {confirmLabel}
        </PrimaryButton>
      </form>
    </BottomSheet>
  );
}
