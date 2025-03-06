import { NextApiRequest, NextApiResponse } from 'next';
import driver from '@/lib/neo4j'; // Ensure this path is correct

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Request method:', req.method); // Log the request method

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const session = driver.session();
  try {
    const result = await session.run('MATCH (u:User) RETURN u.email AS email, u.name AS name, u.avatar AS avatar LIMIT 10');
    const users = result.records.map(record => ({
      email: record.get('email'),
      name: record.get('name'),
      avatar: record.get('avatar'),
    }));
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    await session.close();
  }
}