const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:3000/api/admin/posts');
    console.log(JSON.stringify(res.data.data[0], null, 2));
  } catch (err) {
    console.error(err.message);
  }
}
test();
