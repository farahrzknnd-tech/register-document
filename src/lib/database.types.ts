export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      berita_acara: {
        Row: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_berita_acara: string
          keterangan: string | null
          link_drive: string | null
          perihal: string
          project_id: string | null
          register_no: string
          tanggal: string
          updated_at: string
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string
          id?: string
          jenis_berita_acara: string
          keterangan?: string | null
          link_drive?: string | null
          perihal: string
          project_id: string | null
          register_no: string
          tanggal: string
          updated_at?: string
        }
        Update: {
          cluster_id?: string | null
          created_at?: string
          id?: string
          jenis_berita_acara?: string
          keterangan?: string | null
          link_drive?: string | null
          perihal?: string
          project_id?: string | null
          register_no?: string
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "berita_acara_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "berita_acara_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clusters: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          project_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          project_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clusters_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      document_ref: {
        Row: {
          created_at: string
          id: string
          ref_id: string
          ref_type: string
          source_id: string
          source_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ref_id: string
          ref_type: string
          source_id: string
          source_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ref_id?: string
          ref_type?: string
          source_id?: string
          source_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      gambar: {
        Row: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_gambar: string
          judul_gambar: string
          keterangan: string | null
          link_drive: string | null
          project_id: string | null
          register_no: string
          revisi: string | null
          status_gambar: string
          status_tindak_lanjut: string
          tanggal_diterima: string
          updated_at: string
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string
          id?: string
          jenis_gambar: string
          judul_gambar: string
          keterangan?: string | null
          link_drive?: string | null
          project_id: string | null
          register_no: string
          revisi?: string | null
          status_gambar?: string
          status_tindak_lanjut?: string
          tanggal_diterima: string
          updated_at?: string
        }
        Update: {
          cluster_id?: string | null
          created_at?: string
          id?: string
          jenis_gambar?: string
          judul_gambar?: string
          keterangan?: string | null
          link_drive?: string | null
          project_id?: string | null
          register_no?: string
          revisi?: string | null
          status_gambar?: string
          status_tindak_lanjut?: string
          tanggal_diterima?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gambar_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gambar_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      register_seq: {
        Row: {
          created_at: string
          document_subtype: string
          document_type: string
          last_seq: number
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          document_subtype: string
          document_type: string
          last_seq?: number
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          document_subtype?: string
          document_type?: string
          last_seq?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      surat: {
        Row: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_surat: string
          kategori_surat: string | null
          keterangan: string | null
          link_drive: string | null
          nomor_surat: string
          penerima: string | null
          pengirim: string | null
          perihal: string
          project_id: string | null
          register_no: string
          tanggal_surat: string
          updated_at: string
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string
          id?: string
          jenis_surat: string
          kategori_surat?: string | null
          keterangan?: string | null
          link_drive?: string | null
          nomor_surat: string
          penerima?: string | null
          pengirim?: string | null
          perihal: string
          project_id: string | null
          register_no: string
          tanggal_surat: string
          updated_at?: string
        }
        Update: {
          cluster_id?: string | null
          created_at?: string
          id?: string
          jenis_surat?: string
          kategori_surat?: string | null
          keterangan?: string | null
          link_drive?: string | null
          nomor_surat?: string
          penerima?: string | null
          pengirim?: string | null
          perihal?: string
          project_id?: string | null
          register_no?: string
          tanggal_surat?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surat_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surat_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      surat_penunjukan: {
        Row: {
          cluster_id: string | null
          created_at: string
          durasi: number | null
          id: string
          jenis_pekerjaan: string
          keterangan: string | null
          link_risalah: string | null
          lokasi: string | null
          nama_kontraktor: string
          nomor_sp: string
          project_id: string | null
          register_no: string
          tanggal_finish: string | null
          tanggal_kickoff: string | null
          tanggal_sp: string
          tanggal_start: string | null
          updated_at: string
        }
        Insert: {
          cluster_id?: string | null
          created_at?: string
          durasi?: number | null
          id?: string
          jenis_pekerjaan: string
          keterangan?: string | null
          link_risalah?: string | null
          lokasi?: string | null
          nama_kontraktor: string
          nomor_sp: string
          project_id: string | null
          register_no: string
          tanggal_finish?: string | null
          tanggal_kickoff?: string | null
          tanggal_sp: string
          tanggal_start?: string | null
          updated_at?: string
        }
        Update: {
          cluster_id?: string | null
          created_at?: string
          durasi?: number | null
          id?: string
          jenis_pekerjaan?: string
          keterangan?: string | null
          link_risalah?: string | null
          lokasi?: string | null
          nama_kontraktor?: string
          nomor_sp?: string
          project_id?: string | null
          register_no?: string
          tanggal_finish?: string | null
          tanggal_kickoff?: string | null
          tanggal_sp?: string
          tanggal_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "surat_penunjukan_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surat_penunjukan_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assert_admin_project_cluster: {
        Args: { p_cluster: string | null; p_project: string | null }
        Returns: undefined
      }
      assert_register_consistent: {
        Args: {
          p_date: string
          p_register_no: string
          p_subtype: string
          p_type: string
        }
        Returns: undefined
      }
      create_berita_acara: {
        Args: {
          p_cluster_id: string | null
          p_jenis_berita_acara: string
          p_keterangan: string
          p_link_drive: string
          p_perihal: string
          p_project_id: string | null
          p_refs?: Json
          p_tanggal: string
        }
        Returns: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_berita_acara: string
          keterangan: string | null
          link_drive: string | null
          perihal: string
          project_id: string | null
          register_no: string
          tanggal: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "berita_acara"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_gambar: {
        Args: {
          p_cluster_id: string | null
          p_jenis_gambar: string
          p_judul_gambar: string
          p_keterangan: string
          p_link_drive: string
          p_project_id: string | null
          p_refs?: Json
          p_revisi: string
          p_status_gambar: string
          p_tanggal_diterima: string
        }
        Returns: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_gambar: string
          judul_gambar: string
          keterangan: string | null
          link_drive: string | null
          project_id: string | null
          register_no: string
          revisi: string | null
          status_gambar: string
          status_tindak_lanjut: string
          tanggal_diterima: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "gambar"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_surat: {
        Args: {
          p_cluster_id: string | null
          p_jenis_surat: string
          p_kategori_surat: string
          p_keterangan: string
          p_link_drive: string
          p_nomor_surat: string
          p_penerima: string
          p_pengirim: string
          p_perihal: string
          p_project_id: string | null
          p_refs?: Json
          p_tanggal_surat: string
        }
        Returns: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_surat: string
          kategori_surat: string | null
          keterangan: string | null
          link_drive: string | null
          nomor_surat: string
          penerima: string | null
          pengirim: string | null
          perihal: string
          project_id: string | null
          register_no: string
          tanggal_surat: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "surat"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_surat_penunjukan: {
        Args: {
          p_cluster_id: string | null
          p_jenis_pekerjaan: string
          p_keterangan: string
          p_link_risalah: string
          p_lokasi: string
          p_nama_kontraktor: string
          p_nomor_sp: string
          p_project_id: string | null
          p_refs?: Json
          p_tanggal_finish: string
          p_tanggal_kickoff: string
          p_tanggal_sp: string
          p_tanggal_start: string
        }
        Returns: {
          cluster_id: string | null
          created_at: string
          durasi: number | null
          id: string
          jenis_pekerjaan: string
          keterangan: string | null
          link_risalah: string | null
          lokasi: string | null
          nama_kontraktor: string
          nomor_sp: string
          project_id: string | null
          register_no: string
          tanggal_finish: string | null
          tanggal_kickoff: string | null
          tanggal_sp: string
          tanggal_start: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "surat_penunjukan"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_active: { Args: never; Returns: boolean }
      current_user_admin: { Args: never; Returns: boolean }
      document_exists: {
        Args: { p_id: string; p_type: string }
        Returns: boolean
      }
      document_project_id: {
        Args: { p_id: string; p_type: string }
        Returns: string | null
      }
      next_register_no: {
        Args: { p_subtype: string; p_type: string; p_year: number }
        Returns: string
      }
      recompute_gambar_follow_up: {
        Args: { p_gambar_id: string }
        Returns: undefined
      }
      register_prefix: {
        Args: { p_subtype: string; p_type: string }
        Returns: string
      }
      register_year: { Args: { p_register_no: string }; Returns: number }
      set_document_refs: {
        Args: { p_refs?: Json; p_source_id: string; p_source_type: string }
        Returns: undefined
      }
      update_berita_acara: {
        Args: {
          p_cluster_id: string | null
          p_id: string
          p_jenis_berita_acara: string
          p_keterangan: string
          p_link_drive: string
          p_perihal: string
          p_project_id: string | null
          p_refs?: Json
          p_tanggal: string
        }
        Returns: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_berita_acara: string
          keterangan: string | null
          link_drive: string | null
          perihal: string
          project_id: string | null
          register_no: string
          tanggal: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "berita_acara"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_gambar: {
        Args: {
          p_cluster_id: string | null
          p_id: string
          p_jenis_gambar: string
          p_judul_gambar: string
          p_keterangan: string
          p_link_drive: string
          p_project_id: string | null
          p_refs?: Json
          p_revisi: string
          p_status_gambar: string
          p_tanggal_diterima: string
        }
        Returns: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_gambar: string
          judul_gambar: string
          keterangan: string | null
          link_drive: string | null
          project_id: string | null
          register_no: string
          revisi: string | null
          status_gambar: string
          status_tindak_lanjut: string
          tanggal_diterima: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "gambar"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_surat: {
        Args: {
          p_cluster_id: string | null
          p_id: string
          p_jenis_surat: string
          p_kategori_surat: string
          p_keterangan: string
          p_link_drive: string
          p_nomor_surat: string
          p_penerima: string
          p_pengirim: string
          p_perihal: string
          p_project_id: string | null
          p_refs?: Json
          p_tanggal_surat: string
        }
        Returns: {
          cluster_id: string | null
          created_at: string
          id: string
          jenis_surat: string
          kategori_surat: string | null
          keterangan: string | null
          link_drive: string | null
          nomor_surat: string
          penerima: string | null
          pengirim: string | null
          perihal: string
          project_id: string | null
          register_no: string
          tanggal_surat: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "surat"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_surat_penunjukan: {
        Args: {
          p_cluster_id: string | null
          p_id: string
          p_jenis_pekerjaan: string
          p_keterangan: string
          p_link_risalah: string
          p_lokasi: string
          p_nama_kontraktor: string
          p_nomor_sp: string
          p_project_id: string | null
          p_refs?: Json
          p_tanggal_finish: string
          p_tanggal_kickoff: string
          p_tanggal_sp: string
          p_tanggal_start: string
        }
        Returns: {
          cluster_id: string | null
          created_at: string
          durasi: number | null
          id: string
          jenis_pekerjaan: string
          keterangan: string | null
          link_risalah: string | null
          lokasi: string | null
          nama_kontraktor: string
          nomor_sp: string
          project_id: string | null
          register_no: string
          tanggal_finish: string | null
          tanggal_kickoff: string | null
          tanggal_sp: string
          tanggal_start: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "surat_penunjukan"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_project_references: {
        Args: { p_source_id: string; p_source_type: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

