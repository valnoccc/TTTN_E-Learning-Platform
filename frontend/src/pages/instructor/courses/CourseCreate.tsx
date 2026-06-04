import CourseDetailShell from './CourseDetailShell';
import CourseOverview from './tabs/CourseOverview';

export default function CourseCreate() {
  return (
    <CourseDetailShell mode="create">
      <CourseOverview />
    </CourseDetailShell>
  );
}
