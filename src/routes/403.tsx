import { createFileRoute } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { ErrorPage } from "@/components/autovault/error-page";

export const Route = createFileRoute("/403")({
  head: () => ({
    meta: [{ title: "Access denied — AutoVault" }, { name: "robots", content: "noindex" }],
  }),
  component: () => (
    <ErrorPage
      code={403}
      icon={Lock}
      title="Access denied"
      description="You don't have permission to view this page."
    />
  ),
});
