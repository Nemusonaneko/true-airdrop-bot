import sql from "../db";

export async function findUser(userId: string) {
  return await sql`
        SELECT * FROM users
        WHERE discord_id = ${userId}
    `;
}

export async function submitUserAddress(userId: string, walletAddress: string) {
  return await sql`
        UPDATE users 
        SET wallet = ${walletAddress}
        WHERE discord_id = ${userId}
    `;
}
