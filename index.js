require("dotenv").config();
const axios = require("axios");
const cheerio = require("cheerio");
const cliProgress = require("cli-progress");
const prompt = require("prompt");
const wget = require("node-wget-promise");
const { exit } = require("process");

const progressBar = new cliProgress.SingleBar(
	{},
	cliProgress.Presets.shades_classic
);

const properties = [
	{
		name: "path",
		description: "Directory path",
		required: true,
	},
	{
		name: "url",
		description: "URL",
		required: true,
	},
	{
		name: "lesson",
		description: "Lesson number",
		default: 1,
	},
];

console.log(
	`
==================================================================================\b
||               A C A D E M I N D  V I D E O  D O W N L O A D E R              ||\b
||                         Jose Antonio Ayllón Llamas                           ||\b
||                         https://github.com/Joseaay                           ||\b
==================================================================================\b
    `
);

prompt.start();

prompt.get(properties, function (err, result) {
	if (err) {
		console.log(err);
		return 1;
	}
	downloadCourses(result.path, result.url, result.lesson);
});

async function downloadCourses(directory, url, lessonNumber) {
	if (!url) {
		console.log(
			`
==================================================================================\b
||                   ==> COURSE SUCCESSFULLY DOWNLOADED  <===                   ||\b
==================================================================================\b
            `
		);
		exit(0);
	}

	const pageContent = await getPageContent(url);
	const $ = cheerio.load(pageContent.data);
	const lecture = $("#lecture_heading");
	const lectureTitle = lecture.text().replace(/(\r\n|\n|\r|\s\s+)/gm, "");
	const nextLectureUrl = lecture.attr("data-next-lecture-url");

	const download = $("a.download");
	const downloadLink = download.attr("href");
	const fileName = download.attr("data-x-origin-download-name");

	console.log(
		`\n==================================================================================`
	);
	console.log(`====> LECTURE ${lessonNumber}: `, lectureTitle);
	console.log("=> Download link: ", downloadLink);
	console.log(
		"=> Next lecture URL: ",
		`https://pro.academind.com${nextLectureUrl}`
	);

	if (downloadLink) {
		console.log("=> Downloading: ", fileName);
		progressBar.start(100, 0);

		const result = await downloadFile({
			link: downloadLink,
			directory,
			lessonNumber,
			lectureTitle,
			fileName,
		});
		lessonNumber++;
		progressBar.stop();

		if (result) console.log("\n=> Successfully downlaoded: ", lectureTitle);

		downloadCourses(
			directory,
			`https://pro.academind.com${nextLectureUrl}`,
			lessonNumber
		);
	}
}

const downloadFile = ({
	link,
	directory,
	lessonNumber,
	lectureTitle,
	fileName,
}) =>
	wget(link, {
		output: `${directory}/${lessonNumber}-${lectureTitle.replace(
			/\//g,
			"-"
		)}--${fileName}`,
		onProgress: ({ percentage }) => progressBar.update(percentage * 100),
	});

const getPageContent = (url) =>
	axios({
		url: url,
		method: "get",
		headers: {
			Cookie: process.env.COOKIE,
		},
	});
