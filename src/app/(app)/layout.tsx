import { Box } from "@mui/material";
import { AppHeader } from "@/components/AppHeader";
import { SignedOut } from "@/components/SignedOut";
import { getUser, LOGOUT_URL } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) return <SignedOut />;

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "background.default" }}>
      <AppHeader name={user.name} email={user.email} logoutUrl={LOGOUT_URL} />
      {children}
    </Box>
  );
}
