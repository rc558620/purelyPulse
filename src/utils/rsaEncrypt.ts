// RSA 加密工具：前端使用服务端公钥加密密码等敏感字段
// 对应后端 AuthRsaService（purelyprofit-server）
import JSEncrypt from 'jsencrypt'
import { http } from './http'

// ─── 类型 ─────────────────────────────────────────────────────────────────

interface PublicKeyResponse {
  publicKey: string
}

// ─── 公钥缓存 ─────────────────────────────────────────────────────────────

let cachedPublicKey: string | null = null

/**
 * 获取 RSA 公钥（带内存缓存）
 *
 * 优先使用缓存的公钥，避免每次提交都请求。
 * 首次调用或缓存失效时从服务端获取。
 *
 * @returns PEM 格式 RSA 公钥
 */
export const fetchPublicKey = async (): Promise<string> => {
  if (cachedPublicKey) {
    return cachedPublicKey
  }

  const response = await http.get<PublicKeyResponse>('/pulse/auth/public-key')
  cachedPublicKey = response.publicKey

  return cachedPublicKey
}

/**
 * 清除公钥缓存
 *
 * 当加密失败（可能是服务端重启导致密钥轮换）时调用，
 * 下次加密时会重新获取公钥。
 */
export const clearPublicKeyCache = (): void => {
  cachedPublicKey = null
}

// ─── 加密函数 ─────────────────────────────────────────────────────────────

/**
 * 使用 RSA 公钥加密明文
 *
 * 流程：
 * 1. 获取服务端公钥
 * 2. 使用 jsencrypt 库进行 RSA PKCS1 v1.5 加密
 * 3. 返回 Base64 编码的密文
 *
 * @param plaintext 待加密的明文（如密码）
 * @returns Base64 编码的 RSA 密文
 * @throws 加密失败时抛出异常
 */
export const rsaEncrypt = async (plaintext: string): Promise<string> => {
  if (!plaintext) {
    return plaintext
  }

  const publicKey = await fetchPublicKey()

  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(publicKey)

  const encrypted = encrypt.encrypt(plaintext)

  if (!encrypted) {
    // 加密失败，清除缓存以便下次重试
    clearPublicKeyCache()
    throw new Error('RSA 加密失败，请稍后重试')
  }

  return encrypted
}

/**
 * 批量加密对象中的指定字段
 *
 * 便利函数：对 payload 中的指定字段逐一进行 RSA 加密，
 * 返回新的对象（不修改原对象）。
 *
 * @param payload 原始数据对象
 * @param fields 需要加密的字段名列表
 * @returns 加密后的新对象
 */
export const rsaEncryptFields = async <T extends Record<string, unknown>>(
  payload: T,
  fields: (keyof T)[],
): Promise<T> => {
  const result = { ...payload }

  await Promise.all(
    fields.map(async (field) => {
      const value = payload[field]
      if (typeof value === 'string' && value) {
        result[field] = (await rsaEncrypt(value)) as T[keyof T]
      }
    }),
  )

  return result
}
