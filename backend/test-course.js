fetch('http://localhost:3000/public/courses/1002')
  .then(res => res.json())
  .then(data => {
    console.log(Object.keys(data.data));
    console.log("updatedAt:", data.data.updatedAt, data.data.UpdatedAt);
    console.log("createdAt:", data.data.createdAt, data.data.CreatedAt);
    console.log("totalStudents:", data.data.totalStudents);
    console.log("giangVien keys:", Object.keys(data.data.giangVien));
  })
  .catch(err => console.error(err));
