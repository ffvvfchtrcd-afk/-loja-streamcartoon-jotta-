import { prisma } from './prisma'

export async function logActivity(adminId, adminName, action, details = '', ip = '') {
  try {
    await prisma.activityLog.create({
      data: { adminId, adminName, action, details, ip },
    })
  } catch {}
}
