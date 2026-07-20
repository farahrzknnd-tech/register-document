import { describe, expect, it } from "vitest";
import type { SuratPenunjukan } from "../lib/types";
import {
  getSuratPenunjukanAgendaTitle,
  getSuratPenunjukanDashboardTitle,
  matchesDashboardExplorerSelection,
} from "./dashboardUtils";

const suratPenunjukan: SuratPenunjukan = {
  id: "sp-1",
  project_id: null,
  cluster_id: "cluster-chelia",
  register_no: "SP-26-0010",
  nomor_sp: "132/TOP/DA-DTSA/VII/2026",
  tanggal_sp: "2026-07-20",
  nama_kontraktor: "PT TRIMITRA OMEGA PRATAMA",
  jenis_pekerjaan: "Pengadaan dan Pemasangan Air Mancur Danau",
  lokasi: "Cluster Chelia",
  tanggal_start: "2026-07-10",
  tanggal_finish: "2026-09-10",
  durasi: 63,
  tanggal_kickoff: "2026-07-13",
  link_risalah: null,
  keterangan: null,
  created_at: "2026-07-20T00:00:00Z",
};

describe("dashboard document explorer behavior", () => {
  const cheliaSuratPenunjukan = {
    summary: {
      type: "surat_penunjukan" as const,
      subtitle: "PT TRIMITRA OMEGA PRATAMA",
    },
    clusterName: "CLUSTER CHELIA",
    status: "SP",
  };

  const emeraldSuratPenunjukan = {
    ...cheliaSuratPenunjukan,
    clusterName: "RUKO EMERALD (A3)",
  };

  it("filters a type selection by both document type and selected cluster", () => {
    const selection = {
      kind: "type" as const,
      type: "surat_penunjukan" as const,
      clusterName: "CLUSTER CHELIA",
    };

    expect(
      matchesDashboardExplorerSelection(cheliaSuratPenunjukan, selection),
    ).toBe(true);
    expect(
      matchesDashboardExplorerSelection(emeraldSuratPenunjukan, selection),
    ).toBe(false);
  });

  it("uses jenis pekerjaan as the Surat Penunjukan dashboard title", () => {
    expect(getSuratPenunjukanDashboardTitle(suratPenunjukan)).toBe(
      "Pengadaan dan Pemasangan Air Mancur Danau",
    );
  });

  it("uses jenis pekerjaan as the agenda heading instead of Kick Off Meeting", () => {
    expect(getSuratPenunjukanAgendaTitle(suratPenunjukan)).toBe(
      "Pengadaan dan Pemasangan Air Mancur Danau",
    );
  });
});
