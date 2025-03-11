import { NextResponse } from 'next/server';
import driver from '@/lib/clients/driver'; // Fixed import path
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { Record } from 'neo4j-driver'; // Import Record type

export async function GET() {
  // Log the session status
  const session = await getServerSession(authOptions);
  console.log('Session status:', session ? 'Authenticated' : 'Not authenticated');
  console.log('Session data:', JSON.stringify(session, null, 2));
  
  // If you want to require authentication, uncomment the following:
  // if (!session) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }
  
  const dbSession = driver.session();
  try {
    const result = await dbSession.run('MATCH (u:User) RETURN u.email AS email, u.name AS name, u.avatar AS avatar LIMIT 10');
    const users = result.records.map((record: Record) => ({
      email: record.get('email'),
      name: record.get('name'),
      avatar: record.get('avatar'),
    }));
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  } finally {
    await dbSession.close();
  }
}