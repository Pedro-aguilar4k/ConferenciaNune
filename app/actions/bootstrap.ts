"use server"

import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { sql } from "drizzle-orm"

/**
 * Verifica se o sistema já possui algum usuário cadastrado.
 * Usado para exibir a tela de configuração inicial (criação do admin).
 */
export async function hasAnyUser(): Promise<boolean> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(user)
  return (row?.count ?? 0) > 0
}

export type BootstrapResult = { ok: true } | { ok: false; error: string }

/**
 * Cria o primeiro usuário administrador. Só funciona se não houver
 * nenhum usuário no sistema (proteção contra uso indevido).
 */
export async function bootstrapAdmin(formData: {
  name: string
  username: string
  password: string
}): Promise<BootstrapResult> {
  if (await hasAnyUser()) {
    return { ok: false, error: "O sistema já foi configurado." }
  }

  const username = formData.username.trim().toLowerCase()
  const name = formData.name.trim()

  if (!name || !username || formData.password.length < 8) {
    return { ok: false, error: "Preencha nome, usuário e uma senha com ao menos 8 caracteres." }
  }

  try {
    // Better Auth exige um email internamente; geramos um sintético a partir do username.
    await auth.api.signUpEmail({
      body: {
        name,
        email: `${username}@conferencia.local`,
        password: formData.password,
        username,
      },
    })

    // Promove o usuário recém-criado a admin.
    await db
      .update(user)
      .set({ role: "admin" })
      .where(sql`${user.username} = ${username}`)

    return { ok: true }
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro ao criar administrador."
    return { ok: false, error: message }
  }
}
