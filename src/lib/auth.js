import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET
if (!SECRET) {
  console.error('⚠️  JWT_SECRET não definido! Gere um secret forte e adicione ao .env')
}
const SECRET_FALLBACK = SECRET || 'INSECURE-DEV-ONLY-CHANGE-IN-PRODUCTION'

export function generateToken(admin) {
  return jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, SECRET_FALLBACK, { expiresIn: '7d' })
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_FALLBACK)
  } catch {
    return null
  }
}

export function generateUserToken(user) {
  return jwt.sign({ id: user.id, username: user.username, type: 'user' }, SECRET_FALLBACK, { expiresIn: '30d' })
}

export function getAdminFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  const decoded = verifyToken(token)
  return decoded && decoded.type !== 'user' ? decoded : null
}

export function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.split(' ')[1]
  return verifyToken(token)
}
