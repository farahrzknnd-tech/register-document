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
          project_id?: string | null
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
      billing_activity_log: {
        Row: {
          action: string
          actor_user_id: string | null
          billing_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          billing_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          billing_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_activity_log_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "spk_billing_financial_summary"
            referencedColumns: ["billing_id"]
          },
          {
            foreignKeyName: "billing_activity_log_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "spk_billings"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_stage_definitions: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          sort_order: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      billing_stage_progress: {
        Row: {
          billing_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          stage_definition_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billing_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          stage_definition_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billing_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          stage_definition_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_stage_progress_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "spk_billing_financial_summary"
            referencedColumns: ["billing_id"]
          },
          {
            foreignKeyName: "billing_stage_progress_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "spk_billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_stage_progress_stage_definition_id_fkey"
            columns: ["stage_definition_id"]
            isOneToOne: false
            referencedRelation: "billing_stage_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_statuses: {
        Row: {
          active: boolean
          code: string
          color_key: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          sort_order: number
          terminal: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          code: string
          color_key?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          terminal?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          color_key?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          terminal?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      billing_termin_template_items: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          name: string
          percentage: number | null
          sequence_no: number
          template_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          percentage?: number | null
          sequence_no: number
          template_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          percentage?: number | null
          sequence_no?: number
          template_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_termin_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "billing_termin_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_termin_templates: {
        Row: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      billing_termins: {
        Row: {
          billed_amount: number
          billed_date: string | null
          billing_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          notes: string | null
          paid_amount: number
          paid_date: string | null
          percentage: number | null
          planned_amount: number
          sequence_no: number
          status: string
          template_item_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          billed_amount?: number
          billed_date?: string | null
          billing_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          notes?: string | null
          paid_amount?: number
          paid_date?: string | null
          percentage?: number | null
          planned_amount?: number
          sequence_no: number
          status?: string
          template_item_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          billed_amount?: number
          billed_date?: string | null
          billing_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          notes?: string | null
          paid_amount?: number
          paid_date?: string | null
          percentage?: number | null
          planned_amount?: number
          sequence_no?: number
          status?: string
          template_item_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_termins_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "spk_billing_financial_summary"
            referencedColumns: ["billing_id"]
          },
          {
            foreignKeyName: "billing_termins_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "spk_billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_termins_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "billing_termin_template_items"
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
      contractors: {
        Row: {
          active: boolean
          address: string | null
          code: string | null
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          pic_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active?: boolean
          address?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          pic_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active?: boolean
          address?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          pic_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
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
          project_id?: string | null
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
      spk_billings: {
        Row: {
          billing_status_id: string
          cluster_id: string | null
          contract_value: number
          contractor_id: string | null
          contractor_name_snapshot: string
          created_at: string
          created_by: string | null
          document_drive_url: string | null
          id: string
          kickoff_date: string | null
          notes: string | null
          project_id: string | null
          spk_date: string | null
          spk_number: string
          stage_weight: string | null
          surat_penunjukan_id: string | null
          termin_template_id: string | null
          updated_at: string
          updated_by: string | null
          work_finish_date: string | null
          work_location: string | null
          work_name: string
          work_start_date: string | null
        }
        Insert: {
          billing_status_id: string
          cluster_id?: string | null
          contract_value?: number
          contractor_id?: string | null
          contractor_name_snapshot: string
          created_at?: string
          created_by?: string | null
          document_drive_url?: string | null
          id?: string
          kickoff_date?: string | null
          notes?: string | null
          project_id?: string | null
          spk_date?: string | null
          spk_number: string
          stage_weight?: string | null
          surat_penunjukan_id?: string | null
          termin_template_id?: string | null
          updated_at?: string
          updated_by?: string | null
          work_finish_date?: string | null
          work_location?: string | null
          work_name: string
          work_start_date?: string | null
        }
        Update: {
          billing_status_id?: string
          cluster_id?: string | null
          contract_value?: number
          contractor_id?: string | null
          contractor_name_snapshot?: string
          created_at?: string
          created_by?: string | null
          document_drive_url?: string | null
          id?: string
          kickoff_date?: string | null
          notes?: string | null
          project_id?: string | null
          spk_date?: string | null
          spk_number?: string
          stage_weight?: string | null
          surat_penunjukan_id?: string | null
          termin_template_id?: string | null
          updated_at?: string
          updated_by?: string | null
          work_finish_date?: string | null
          work_location?: string | null
          work_name?: string
          work_start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spk_billings_billing_status_id_fkey"
            columns: ["billing_status_id"]
            isOneToOne: false
            referencedRelation: "billing_statuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spk_billings_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spk_billings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spk_billings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spk_billings_surat_penunjukan_id_fkey"
            columns: ["surat_penunjukan_id"]
            isOneToOne: false
            referencedRelation: "surat_penunjukan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spk_billings_termin_template_id_fkey"
            columns: ["termin_template_id"]
            isOneToOne: false
            referencedRelation: "billing_termin_templates"
            referencedColumns: ["id"]
          },
        ]
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
          project_id?: string | null
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
          project_id?: string | null
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
      spk_billing_financial_summary: {
        Row: {
          billing_id: string | null
          billing_percentage: number | null
          contract_value: number | null
          payment_percentage: number | null
          remaining_contract: number | null
          total_billed: number | null
          total_paid: number | null
          total_planned: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      assert_admin_project_cluster: {
        Args: { p_cluster: string; p_project: string }
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
          p_cluster_id: string
          p_jenis_berita_acara: string
          p_keterangan: string
          p_link_drive: string
          p_perihal: string
          p_project_id: string
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
          p_cluster_id: string
          p_jenis_gambar: string
          p_judul_gambar: string
          p_keterangan: string
          p_link_drive: string
          p_project_id: string
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
          p_cluster_id: string
          p_jenis_surat: string
          p_kategori_surat: string
          p_keterangan: string
          p_link_drive: string
          p_nomor_surat: string
          p_penerima: string
          p_pengirim: string
          p_perihal: string
          p_project_id: string
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
          p_cluster_id: string
          p_jenis_pekerjaan: string
          p_keterangan: string
          p_link_risalah: string
          p_lokasi: string
          p_nama_kontraktor: string
          p_nomor_sp: string
          p_project_id: string
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
        Returns: string
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
      save_billing_termin_template: {
        Args: {
          p_active?: boolean
          p_code?: string
          p_description?: string
          p_items?: Json
          p_name?: string
          p_template_id?: string
        }
        Returns: {
          active: boolean
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "billing_termin_templates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_document_refs: {
        Args: { p_refs?: Json; p_source_id: string; p_source_type: string }
        Returns: undefined
      }
      update_berita_acara: {
        Args: {
          p_cluster_id: string
          p_id: string
          p_jenis_berita_acara: string
          p_keterangan: string
          p_link_drive: string
          p_perihal: string
          p_project_id: string
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
          p_cluster_id: string
          p_id: string
          p_jenis_gambar: string
          p_judul_gambar: string
          p_keterangan: string
          p_link_drive: string
          p_project_id: string
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
          p_cluster_id: string
          p_id: string
          p_jenis_surat: string
          p_kategori_surat: string
          p_keterangan: string
          p_link_drive: string
          p_nomor_surat: string
          p_penerima: string
          p_pengirim: string
          p_perihal: string
          p_project_id: string
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
          p_cluster_id: string
          p_id: string
          p_jenis_pekerjaan: string
          p_keterangan: string
          p_link_risalah: string
          p_lokasi: string
          p_nama_kontraktor: string
          p_nomor_sp: string
          p_project_id: string
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

