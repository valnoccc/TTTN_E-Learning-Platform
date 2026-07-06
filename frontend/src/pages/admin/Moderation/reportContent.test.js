import assert from 'node:assert/strict';
import { formatReportContent } from './reportContent.js';

const raw = '{"title":"Học cùng tại đây","content":"","lessonName":"Bài giảng hiện..."}';
const formatted = formatReportContent(raw);

assert.equal(formatted.title, 'Học cùng tại đây');
assert.equal(formatted.subtitle, 'Bài giảng hiện...');

const htmlRaw = '{"title":"Học cũng tạm đấy","content":"Bài giảng hiện tại • <br/><img src=\\"https://example.com/v.mp4\\">","lessonName":"Bài giảng hiện tại"}';
const htmlFormatted = formatReportContent(htmlRaw);

assert.equal(htmlFormatted.title, 'Học cũng tạm đấy');
assert.equal(htmlFormatted.subtitle, 'Bài giảng hiện tại');
assert.equal(htmlFormatted.subtitle.includes('<br'), false);
