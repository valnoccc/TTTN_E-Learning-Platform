async function test() {
  await fetch('http://localhost:3000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'a@mail.com', password: '123', fullName: 'Test User' })
  });

  const res = await fetch('http://localhost:3000/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'a@mail.com', password: '123' })
  });
  const data = await res.json();
  console.log(data);
}
test();
