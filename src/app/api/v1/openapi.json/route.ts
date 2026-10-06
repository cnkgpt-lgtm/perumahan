// GET /api/v1/openapi.json — spesifikasi OpenAPI 3.0 REST API v1 SISTER.
// Ditulis manual agar akurat dengan route yang ada.
import { j } from "@/lib/api";

const Error = {
  type: "object",
  properties: { message: { type: "string", example: "Data tidak valid." } },
  required: ["message"],
};

const MetaHalaman = {
  type: "object",
  properties: {
    halaman: { type: "integer", example: 1 },
    per_halaman: { type: "integer", example: 10 },
    total: { type: "integer", example: 25 },
    total_halaman: { type: "integer", example: 3 },
  },
};

const PostRingkas = {
  type: "object",
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    slug: { type: "string" },
    category: { type: "string", enum: ["pengumuman", "berita", "kegiatan"] },
    excerpt: { type: "string" },
    published_at: { type: "string", format: "date-time", nullable: true },
    image_url: { type: "string", nullable: true },
    is_pinned: { type: "boolean" },
  },
};

const RumahRingkas = {
  type: "object",
  properties: {
    id: { type: "string" },
    number: { type: "string", example: "A-12" },
    head_name: { type: "string" },
  },
};

const JenisIuran = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    amount: { type: "integer", example: 50000 },
    frequency: { type: "string", enum: ["bulanan", "sekali"] },
    starts_on: { type: "string", format: "date", nullable: true },
    due_on: { type: "string", format: "date", nullable: true },
    description: { type: "string", nullable: true },
  },
};

const Rekening = {
  type: "object",
  properties: {
    id: { type: "string" },
    bank_name: { type: "string" },
    account_number: { type: "string", nullable: true },
    account_name: { type: "string", nullable: true },
    has_qris: { type: "boolean" },
    qris_image_url: { type: "string", nullable: true },
  },
};

const Pembayaran = {
  type: "object",
  properties: {
    id: { type: "string" },
    nomor_kuitansi: { type: "string", example: "SIST-202610-0001" },
    household: RumahRingkas,
    dues_type: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
    period: { type: "string", example: "2026-10" },
    amount: { type: "integer" },
    paid_on: { type: "string", format: "date" },
    method: { type: "string", enum: ["tunai", "transfer"] },
    note: { type: "string", nullable: true },
  },
};

const PengajuanRingkas = {
  type: "object",
  properties: {
    id: { type: "string" },
    code: { type: "string", example: "K7X2Q9AB" },
    status: { type: "string", enum: ["menunggu", "disetujui", "ditolak"] },
    household: RumahRingkas,
    dues_type: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
    periods: { type: "array", items: { type: "string" } },
    total: { type: "integer" },
    bank_name: { type: "string", nullable: true },
    payer_name: { type: "string", nullable: true },
    created_at: { type: "string", format: "date-time" },
    reject_reason: { type: "string", nullable: true },
  },
};

const Pengeluaran = {
  type: "object",
  properties: {
    id: { type: "string" },
    spent_on: { type: "string", format: "date" },
    description: { type: "string" },
    amount: { type: "integer" },
    recorded_by: { type: "string", nullable: true },
  },
};

const Pengguna = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    email: { type: "string" },
    is_active: { type: "boolean" },
    created_at: { type: "string", format: "date-time" },
  },
};

const halamanParam = { name: "halaman", in: "query", schema: { type: "integer", default: 1 } };
const perHalamanParam = { name: "per_halaman", in: "query", schema: { type: "integer", default: 10 } };
const idParam = (nama = "id", contoh = "cm123abc") => ({
  name: nama,
  in: "path",
  required: true,
  schema: { type: "string", example: contoh },
});

const admin = [{ cookieAuth: [] }];

const spec = {
  openapi: "3.0.3",
  info: {
    title: "SISTER API",
    version: "1.0.0",
    description:
      "REST API v1 SISTER — Sistem Informasi Cluster. Endpoint publik bebas diakses; endpoint /admin/* membutuhkan sesi login pengurus (cookie NextAuth dari halaman /masuk).",
  },
  servers: [{ url: "/", description: "Server yang sama dengan aplikasi" }],
  tags: [
    { name: "Publik", description: "Tanpa login" },
    { name: "Admin", description: "Perlu login pengurus" },
  ],
  security: [],
  paths: {
    "/api/v1/home": {
      get: {
        tags: ["Publik"],
        summary: "Ringkasan beranda",
        description: "Info situs, kabar disematkan, kegiatan mendatang, kabar terbaru, progres iuran, saldo kas, dan jumlah rumah.",
        responses: {
          "200": {
            description: "Ringkasan beranda",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        tagline: { type: "string" },
                        address: { type: "string" },
                        treasurer_contact: { type: "string" },
                      },
                    },
                    pinned: { type: "array", items: PostRingkas },
                    upcoming: { type: "array", items: PostRingkas },
                    latest: { type: "array", items: PostRingkas },
                    progress: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          dues_type: JenisIuran,
                          label: { type: "string", example: "Oktober 2026" },
                          paid: { type: "integer" },
                          total: { type: "integer" },
                        },
                      },
                    },
                    total_balance: { type: "integer" },
                    total_households: { type: "integer" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/settings": {
      get: {
        tags: ["Publik"],
        summary: "Pengaturan situs",
        responses: {
          "200": {
            description: "Pengaturan situs",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    site_name: { type: "string" },
                    site_tagline: { type: "string" },
                    address: { type: "string" },
                    treasurer_contact: { type: "string" },
                    payment_info: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/posts": {
      get: {
        tags: ["Publik"],
        summary: "Daftar kabar",
        parameters: [
          { name: "kategori", in: "query", schema: { type: "string", enum: ["pengumuman", "berita", "kegiatan"] } },
          halamanParam,
          perHalamanParam,
        ],
        responses: {
          "200": {
            description: "Daftar kabar + paginasi",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { data: { type: "array", items: PostRingkas }, meta: MetaHalaman },
                },
              },
            },
          },
          "422": { description: "Kategori tidak dikenal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/posts/{slug}": {
      get: {
        tags: ["Publik"],
        summary: "Detail kabar",
        parameters: [idParam("slug", "gotong-royong-oktober")],
        responses: {
          "200": {
            description: "Detail kabar + kabar terkait",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    title: { type: "string" },
                    slug: { type: "string" },
                    category: { type: "string" },
                    body: { type: "string" },
                    published_at: { type: "string", format: "date-time" },
                    image_url: { type: "string", nullable: true },
                    is_pinned: { type: "boolean" },
                    event_starts_at: { type: "string", format: "date-time", nullable: true },
                    event_location: { type: "string", nullable: true },
                    author_name: { type: "string", nullable: true },
                    related: { type: "array", items: PostRingkas },
                  },
                },
              },
            },
          },
          "404": { description: "Kabar tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/households": {
      get: {
        tags: ["Publik"],
        summary: "Daftar rumah aktif",
        description: "Hanya id, nomor rumah, dan nama kepala keluarga (tanpa nomor HP).",
        responses: {
          "200": {
            description: "Daftar rumah",
            content: { "application/json": { schema: { type: "array", items: RumahRingkas } } },
          },
        },
      },
    },
    "/api/v1/dues-types": {
      get: {
        tags: ["Publik"],
        summary: "Daftar jenis iuran aktif",
        responses: {
          "200": {
            description: "Daftar jenis iuran",
            content: { "application/json": { schema: { type: "array", items: JenisIuran } } },
          },
        },
      },
    },
    "/api/v1/bank-accounts": {
      get: {
        tags: ["Publik"],
        summary: "Daftar rekening tujuan pembayaran",
        responses: {
          "200": {
            description: "Daftar rekening",
            content: { "application/json": { schema: { type: "array", items: Rekening } } },
          },
        },
      },
    },
    "/api/v1/dues/ledger": {
      get: {
        tags: ["Publik"],
        summary: "Buku iuran per jenis & tahun",
        description:
          "Untuk iuran bulanan: months berisi 12 periode YYYY-MM dan tiap rumah punya peta status per bulan (lunas|dicek|belum|depan). Untuk iuran sekali bayar: status lunas|dicek|belum + tanggal bayar.",
        parameters: [
          { name: "jenis", in: "query", required: true, schema: { type: "string" }, description: "ID jenis iuran" },
          { name: "tahun", in: "query", schema: { type: "integer", default: 2026 } },
        ],
        responses: {
          "200": { description: "Buku iuran", content: { "application/json": { schema: { type: "object" } } } },
          "404": { description: "Jenis iuran tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Parameter tidak valid", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/dues/cashbook": {
      get: {
        tags: ["Publik"],
        summary: "Rekap buku kas per tahun",
        parameters: [{ name: "tahun", in: "query", schema: { type: "integer", default: 2026 } }],
        responses: {
          "200": {
            description: "Buku kas",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    year: { type: "integer" },
                    opening: { type: "integer" },
                    rows: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          bulan: { type: "integer" },
                          masuk: { type: "integer" },
                          keluar: { type: "integer" },
                          saldo: { type: "integer" },
                        },
                      },
                    },
                    total_in: { type: "integer" },
                    total_out: { type: "integer" },
                    closing: { type: "integer" },
                  },
                },
              },
            },
          },
          "422": { description: "Tahun tidak valid", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/households/{id}/dues/{duesId}": {
      get: {
        tags: ["Publik"],
        summary: "Status iuran satu rumah",
        parameters: [idParam(), idParam("duesId"), { name: "tahun", in: "query", schema: { type: "integer", default: 2026 } }],
        responses: {
          "200": {
            description: "Status per periode",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    household: RumahRingkas,
                    dues_type: JenisIuran,
                    periods: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          period: { type: "string" },
                          label: { type: "string" },
                          status: { type: "string", enum: ["lunas", "dicek", "belum", "depan"] },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "404": { description: "Rumah/jenis iuran tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/payment-submissions": {
      post: {
        tags: ["Publik"],
        summary: "Kirim bukti bayar",
        description:
          "Multipart: household_id, dues_type_id, bank_account_id, periods (bisa diulang / koma / JSON), payer_name?, phone?, note?, proof (file JPG/PNG/WEBP/PDF maks 5 MB). Periode yang sudah lunas atau sedang menunggu tidak bisa dikirim ulang.",
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  household_id: { type: "string" },
                  dues_type_id: { type: "string" },
                  bank_account_id: { type: "string" },
                  periods: { type: "array", items: { type: "string", example: "2026-10" } },
                  payer_name: { type: "string" },
                  phone: { type: "string" },
                  note: { type: "string" },
                  proof: { type: "string", format: "binary" },
                },
                required: ["household_id", "dues_type_id", "bank_account_id", "proof"],
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Pengajuan terkirim",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    code: { type: "string", example: "K7X2Q9AB" },
                    total: { type: "integer" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/payment-submissions/{code}": {
      get: {
        tags: ["Publik"],
        summary: "Cek status pengajuan",
        parameters: [idParam("code", "K7X2Q9AB")],
        responses: {
          "200": {
            description: "Status pengajuan",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    status: { type: "string", enum: ["menunggu", "disetujui", "ditolak"] },
                    household: RumahRingkas,
                    dues_type: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, amount: { type: "integer" } } },
                    periods: {
                      type: "array",
                      items: { type: "object", properties: { period: { type: "string" }, label: { type: "string" } } },
                    },
                    total: { type: "integer" },
                    bank_name: { type: "string", nullable: true },
                    payer_name: { type: "string", nullable: true },
                    created_at: { type: "string", format: "date-time" },
                    reject_reason: { type: "string", nullable: true },
                    approved_periods: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          "404": { description: "Kode tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payments": {
      get: {
        tags: ["Admin"],
        summary: "Daftar pembayaran",
        security: admin,
        parameters: [
          { name: "dues_type_id", in: "query", schema: { type: "string" } },
          { name: "household_id", in: "query", schema: { type: "string" } },
          { name: "tahun", in: "query", schema: { type: "string", example: "2026" } },
          { name: "bulan", in: "query", schema: { type: "string", example: "2026-10" } },
          halamanParam,
          perHalamanParam,
        ],
        responses: {
          "200": {
            description: "Daftar pembayaran",
            content: {
              "application/json": {
                schema: { type: "object", properties: { data: { type: "array", items: Pembayaran }, meta: MetaHalaman } },
              },
            },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Catat pembayaran",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  household_id: { type: "string" },
                  dues_type_id: { type: "string" },
                  period: { type: "string", example: "2026-10" },
                  amount: { type: "integer" },
                  paid_on: { type: "string", format: "date", example: "2026-10-06" },
                  method: { type: "string", enum: ["tunai", "transfer"], default: "tunai" },
                  note: { type: "string", nullable: true },
                },
                required: ["household_id", "dues_type_id", "paid_on"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Pembayaran tercatat", content: { "application/json": { schema: Pembayaran } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payments/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Hapus catatan pembayaran",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dihapus", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payment-submissions": {
      get: {
        tags: ["Admin"],
        summary: "Daftar pengajuan bukti bayar",
        security: admin,
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["menunggu", "disetujui", "ditolak"] } },
          halamanParam,
          perHalamanParam,
        ],
        responses: {
          "200": {
            description: "Daftar pengajuan",
            content: {
              "application/json": {
                schema: { type: "object", properties: { data: { type: "array", items: PengajuanRingkas }, meta: MetaHalaman } },
              },
            },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payment-submissions/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Detail pengajuan",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Detail pengajuan", content: { "application/json": { schema: PengajuanRingkas } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payment-submissions/{id}/proof": {
      get: {
        tags: ["Admin"],
        summary: "Lihat bukti bayar",
        description: "Mengalihkan (302) ke /api/gambar/bukti/{id}.",
        security: admin,
        parameters: [idParam()],
        responses: {
          "302": { description: "Alih ke gambar bukti" },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payment-submissions/{id}/approve": {
      post: {
        tags: ["Admin"],
        summary: "Setujui pengajuan",
        description:
          "Membuat satu Payment per periode yang disetujui (method transfer, terhubung ke pengajuan) dalam satu transaksi. Boleh sebagian: periode yang tidak disetujui bisa diberi reject_reason.",
        security: admin,
        parameters: [idParam()],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  periods: { type: "array", items: { type: "string" } },
                  paid_on: { type: "string", format: "date" },
                  reject_reason: { type: "string", nullable: true },
                },
                required: ["periods", "paid_on"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Disetujui", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Sudah diproses / tidak valid", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payment-submissions/{id}/reject": {
      post: {
        tags: ["Admin"],
        summary: "Tolak pengajuan",
        security: admin,
        parameters: [idParam()],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { reject_reason: { type: "string" } },
                required: ["reject_reason"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Ditolak", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Sudah diproses / tidak valid", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payment-submissions/{id}/cancel": {
      post: {
        tags: ["Admin"],
        summary: "Batalkan persetujuan",
        description: "Mengembalikan pengajuan yang disetujui menjadi menunggu dan menghapus pembayaran otomatisnya.",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dibatalkan", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Status tidak sesuai", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/payment-submissions/{id}/reopen": {
      post: {
        tags: ["Admin"],
        summary: "Buka kembali pengajuan yang ditolak",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dibuka kembali", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Status tidak sesuai", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/posts": {
      get: {
        tags: ["Admin"],
        summary: "Daftar kabar (termasuk draf)",
        security: admin,
        parameters: [
          { name: "kategori", in: "query", schema: { type: "string" } },
          halamanParam,
          perHalamanParam,
        ],
        responses: {
          "200": {
            description: "Daftar kabar",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          title: { type: "string" },
                          slug: { type: "string" },
                          category: { type: "string" },
                          published_at: { type: "string", format: "date-time", nullable: true },
                          is_pinned: { type: "boolean" },
                          is_popup: { type: "boolean" },
                          has_image: { type: "boolean" },
                        },
                      },
                    },
                    meta: MetaHalaman,
                  },
                },
              },
            },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Tambah kabar",
        description: "Multipart. Slug dibuat otomatis dari judul bila kosong. Berkas: image, popup_image (JPG/PNG/WEBP maks 5 MB).",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  slug: { type: "string" },
                  category: { type: "string", enum: ["pengumuman", "berita", "kegiatan"] },
                  body: { type: "string" },
                  published_at: { type: "string", format: "date-time" },
                  is_pinned: { type: "string", example: "1" },
                  is_popup: { type: "string", example: "1" },
                  event_starts_at: { type: "string", format: "date-time" },
                  event_location: { type: "string" },
                  image: { type: "string", format: "binary" },
                  popup_image: { type: "string", format: "binary" },
                },
                required: ["title", "category", "body"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Kabar dibuat", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/posts/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Detail kabar",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Detail kabar", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Ubah kabar",
        description: "Multipart; semua field opsional, gambar hanya diganti bila ada berkas baru.",
        security: admin,
        parameters: [idParam()],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  slug: { type: "string" },
                  category: { type: "string", enum: ["pengumuman", "berita", "kegiatan"] },
                  body: { type: "string" },
                  published_at: { type: "string", format: "date-time" },
                  is_pinned: { type: "string" },
                  is_popup: { type: "string" },
                  event_starts_at: { type: "string", format: "date-time" },
                  event_location: { type: "string" },
                  image: { type: "string", format: "binary" },
                  popup_image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Kabar diubah", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Hapus kabar",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dihapus", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/households": {
      get: {
        tags: ["Admin"],
        summary: "Daftar rumah",
        security: admin,
        parameters: [{ name: "cari", in: "query", schema: { type: "string" } }, halamanParam, perHalamanParam],
        responses: {
          "200": {
            description: "Daftar rumah",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          number: { type: "string" },
                          head_name: { type: "string" },
                          phone: { type: "string", nullable: true },
                          occupancy_status: { type: "string", nullable: true },
                          is_active: { type: "boolean" },
                          note: { type: "string", nullable: true },
                        },
                      },
                    },
                    meta: MetaHalaman,
                  },
                },
              },
            },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Tambah rumah",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  number: { type: "string", example: "A-12" },
                  head_name: { type: "string" },
                  phone: { type: "string", nullable: true },
                  kk_number: { type: "string", nullable: true },
                  occupancy_status: { type: "string", nullable: true },
                  note: { type: "string", nullable: true },
                  is_active: { type: "boolean" },
                },
                required: ["number", "head_name"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Rumah dibuat", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/households/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Detail rumah",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Detail rumah", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Ubah rumah",
        security: admin,
        parameters: [idParam()],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  number: { type: "string" },
                  head_name: { type: "string" },
                  phone: { type: "string", nullable: true },
                  kk_number: { type: "string", nullable: true },
                  occupancy_status: { type: "string", nullable: true },
                  note: { type: "string", nullable: true },
                  is_active: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Rumah diubah", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Hapus rumah",
        description: "Ditolak bila rumah punya riwayat pembayaran/pengajuan (nonaktifkan saja).",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dihapus", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Punya riwayat data", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/dues-types": {
      get: {
        tags: ["Admin"],
        summary: "Daftar jenis iuran",
        security: admin,
        responses: {
          "200": {
            description: "Daftar jenis iuran",
            content: { "application/json": { schema: { type: "array", items: JenisIuran } } },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Tambah jenis iuran",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  amount: { type: "integer", example: 50000 },
                  frequency: { type: "string", enum: ["bulanan", "sekali"] },
                  starts_on: { type: "string", format: "date", nullable: true },
                  due_on: { type: "string", format: "date", nullable: true },
                  description: { type: "string", nullable: true },
                  is_active: { type: "boolean" },
                },
                required: ["name", "amount", "frequency"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Jenis iuran dibuat", content: { "application/json": { schema: JenisIuran } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/dues-types/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Detail jenis iuran",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Detail jenis iuran", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Ubah jenis iuran",
        security: admin,
        parameters: [idParam()],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  amount: { type: "integer" },
                  frequency: { type: "string", enum: ["bulanan", "sekali"] },
                  starts_on: { type: "string", format: "date", nullable: true },
                  due_on: { type: "string", format: "date", nullable: true },
                  description: { type: "string", nullable: true },
                  is_active: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Jenis iuran diubah", content: { "application/json": { schema: JenisIuran } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Hapus jenis iuran",
        description: "Ditolak bila punya riwayat pembayaran/pengajuan (nonaktifkan saja).",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dihapus", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Punya riwayat data", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/expenses": {
      get: {
        tags: ["Admin"],
        summary: "Daftar pengeluaran kas",
        security: admin,
        parameters: [
          { name: "tahun", in: "query", schema: { type: "string", example: "2026" } },
          halamanParam,
          perHalamanParam,
        ],
        responses: {
          "200": {
            description: "Daftar pengeluaran",
            content: {
              "application/json": {
                schema: { type: "object", properties: { data: { type: "array", items: Pengeluaran }, meta: MetaHalaman } },
              },
            },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Catat pengeluaran",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  spent_on: { type: "string", format: "date" },
                  description: { type: "string" },
                  amount: { type: "integer" },
                },
                required: ["spent_on", "description", "amount"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Pengeluaran tercatat", content: { "application/json": { schema: Pengeluaran } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/expenses/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Detail pengeluaran",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Detail pengeluaran", content: { "application/json": { schema: Pengeluaran } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Ubah pengeluaran",
        security: admin,
        parameters: [idParam()],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  spent_on: { type: "string", format: "date" },
                  description: { type: "string" },
                  amount: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Pengeluaran diubah", content: { "application/json": { schema: Pengeluaran } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Hapus pengeluaran",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dihapus", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/bank-accounts": {
      get: {
        tags: ["Admin"],
        summary: "Daftar rekening",
        security: admin,
        responses: {
          "200": {
            description: "Daftar rekening",
            content: { "application/json": { schema: { type: "array", items: { type: "object" } } } },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Tambah rekening",
        description: "Multipart. Berkas qris_image (JPG/PNG/WEBP maks 5 MB) opsional.",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  bank_name: { type: "string" },
                  account_number: { type: "string" },
                  account_name: { type: "string" },
                  qris_payload: { type: "string" },
                  is_active: { type: "string", example: "1" },
                  position: { type: "integer" },
                  qris_image: { type: "string", format: "binary" },
                },
                required: ["bank_name"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Rekening dibuat", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/bank-accounts/{id}": {
      get: {
        tags: ["Admin"],
        summary: "Detail rekening",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Detail rekening", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Ubah rekening",
        description: "Multipart; semua field opsional. Kirim hapus_qris=1 untuk menghapus gambar QRIS.",
        security: admin,
        parameters: [idParam()],
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  bank_name: { type: "string" },
                  account_number: { type: "string" },
                  account_name: { type: "string" },
                  qris_payload: { type: "string" },
                  is_active: { type: "string" },
                  position: { type: "integer" },
                  hapus_qris: { type: "string", example: "1" },
                  qris_image: { type: "string", format: "binary" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Rekening diubah", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
      delete: {
        tags: ["Admin"],
        summary: "Hapus rekening",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dihapus", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/settings": {
      get: {
        tags: ["Admin"],
        summary: "Baca pengaturan situs",
        security: admin,
        responses: {
          "200": {
            description: "Peta kunci → nilai",
            content: { "application/json": { schema: { type: "object", additionalProperties: { type: "string" } } } },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
      put: {
        tags: ["Admin"],
        summary: "Ubah pengaturan situs",
        description: "Body berupa objek kunci → nilai, mis. {\"site_name\": \"SISTER\"}.",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", additionalProperties: { type: "string", nullable: true }, example: { site_name: "SISTER" } },
            },
          },
        },
        responses: {
          "200": {
            description: "Pengaturan terbaru",
            content: { "application/json": { schema: { type: "object", additionalProperties: { type: "string" } } } },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Format tidak valid", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/password": {
      put: {
        tags: ["Admin"],
        summary: "Ganti kata sandi sendiri",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  current_password: { type: "string" },
                  password: { type: "string", minLength: 8 },
                  password_confirmation: { type: "string" },
                },
                required: ["current_password", "password", "password_confirmation"],
              },
            },
          },
        },
        responses: {
          "200": { description: "Kata sandi diganti", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "Daftar akun pengurus",
        security: admin,
        responses: {
          "200": {
            description: "Daftar akun",
            content: { "application/json": { schema: { type: "array", items: Pengguna } } },
          },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
        },
      },
      post: {
        tags: ["Admin"],
        summary: "Tambah akun pengurus",
        security: admin,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                },
                required: ["name", "email", "password"],
              },
            },
          },
        },
        responses: {
          "201": { description: "Akun dibuat", content: { "application/json": { schema: Pengguna } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "422": { description: "Validasi gagal", content: { "application/json": { schema: Error } } },
        },
      },
    },
    "/api/v1/admin/users/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Nonaktifkan akun pengurus",
        description: "Menonaktifkan diri sendiri dan menonaktifkan akun aktif terakhir dilarang.",
        security: admin,
        parameters: [idParam()],
        responses: {
          "200": { description: "Dinonaktifkan", content: { "application/json": { schema: Error } } },
          "401": { description: "Perlu login", content: { "application/json": { schema: Error } } },
          "404": { description: "Tidak ditemukan", content: { "application/json": { schema: Error } } },
          "422": { description: "Tidak diizinkan", content: { "application/json": { schema: Error } } },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description: "Sesi login NextAuth — didapat setelah masuk lewat halaman /masuk di browser.",
      },
    },
    schemas: {
      Error,
      MetaHalaman,
      PostRingkas,
      RumahRingkas,
      JenisIuran,
      Rekening,
      Pembayaran,
      PengajuanRingkas,
      Pengeluaran,
      Pengguna,
    },
  },
};

export async function GET() {
  return j(spec);
}
