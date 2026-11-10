"use client";

import { useState, useTransition } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from "@mui/material";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import { deleteSupplier } from "@/app/(app)/lieferanten/actions";

export function DeleteSupplierButton({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  const confirm = () =>
    startTransition(async () => {
      const res = await deleteSupplier(id);
      if (res.error) setError(res.error);
      else setOpen(false);
    });

  return (
    <>
      <Tooltip title="Löschen">
        <IconButton size="small" onClick={() => setOpen(true)} aria-label={`${name} löschen`}>
          <DeleteOutlineRounded fontSize="small" />
        </IconButton>
      </Tooltip>
      <Dialog open={open} onClose={() => !pending && setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Lieferant löschen?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            „{name}“ wird endgültig gelöscht. Das lässt sich nicht rückgängig machen.
          </DialogContentText>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} disabled={pending}>
            Abbrechen
          </Button>
          <Button onClick={confirm} color="error" variant="contained" disabled={pending}>
            {pending ? "Löschen …" : "Löschen"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
