import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const tmpDir = path.join(root, "tmp");
const uploadsDir = path.join(tmpDir, "uploads");
const outputDataDir = path.join(root, "data");
const outputMediaDir = path.join(root, "assets", "media");

const messagePostIds = ["9", "10", "13", "16", "18", "28", "30", "44", "55", "63"];
const galleryPostIds = ["90", "93", "95", "98", "101", "103", "105", "107", "109", "111", "113", "115", "117", "119", "121"];
const videoPostIds = ["175", "168", "170", "172", "166"];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (char === "\n") {
      row.push(value);
      rows.push(row);
      row = [];
      value = "";
      continue;
    }

    if (char !== "\r") {
      value += char;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    headers.reduce((accumulator, header, index) => {
      accumulator[header] = record[index] ?? "";
      return accumulator;
    }, {})
  );
}

function readCsvRows() {
  const csvFile = fs.readdirSync(tmpDir).find((file) => file.endsWith(".csv"));
  if (!csvFile) {
    throw new Error("Unable to locate the WordPress CSV export in tmp/");
  }

  const csvPath = path.join(tmpDir, csvFile);
  const raw = fs.readFileSync(csvPath, "utf8");
  return parseCsv(raw);
}

function stripSizeSuffix(fileName) {
  return fileName.replace(/-\d+x\d+(?=\.[^.]+$)/, "");
}

function resolveUploadFile(fileName) {
  const candidates = [
    path.join(uploadsDir, "2015", "03", fileName),
    path.join(uploadsDir, "wppa-source", "album-1", fileName),
    path.join(uploadsDir, "wppa-source", "album-3", fileName),
    path.join(uploadsDir, "wppa", fileName),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const normalized = stripSizeSuffix(fileName);
  if (normalized !== fileName) {
    return resolveUploadFile(normalized);
  }

  throw new Error(`Unable to resolve media file: ${fileName}`);
}

function copyMedia(fileName, destinationDir) {
  const sourcePath = resolveUploadFile(fileName);
  ensureDir(destinationDir);
  const destinationPath = path.join(destinationDir, path.basename(sourcePath));
  fs.copyFileSync(sourcePath, destinationPath);
  return destinationPath;
}

function toPublicPath(filePath) {
  return filePath
    .replace(`${root}\\`, "")
    .split(path.sep)
    .join("/");
}

function formatDate(dateString) {
  const date = new Date(`${dateString.replace(" ", "T")}Z`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraphizeText(text) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) =>
      `<p>${escapeHtml(part)
        .replace(/\n/g, "<br />")
        .replace(/——/g, "<span class=\"signature-dash\">——</span>")}</p>`
    )
    .join("\n");
}

function simplifyHtml(html) {
  return html
    .replace(/<!--more-->/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/Â/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+(class|style|width|height|align|target|frameborder|border|allowfullscreen|allowfullscreeninteractive|allowtransparency)="[^"]*"/gi, "")
    .replace(/<span[^>]*>/gi, "")
    .replace(/<\/span>/gi, "")
    .replace(/<embed[\s\S]*?<\/embed>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatRichText(content) {
  const cleaned = simplifyHtml(content)
    .replace(/<p>/gi, "\n\n<p>")
    .replace(/<\/p>/gi, "</p>\n\n");

  const html = cleaned
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (/^<(p|div|figure|blockquote|ul|ol|h\d)\b/i.test(part)) {
        return part;
      }

      if (/<(img|a)\b/i.test(part) && !/[^\s>]<img/i.test(part.replace(/<a[\s\S]*?<\/a>/gi, ""))) {
        return part;
      }

      return `<p>${part.replace(/\n/g, "<br />")}</p>`;
    })
    .join("\n");

  return html.replace(/<br \/>\s*<p>/g, "</p>\n<p>").replace(/<\/p>\s*<\/p>/g, "</p>");
}

function extractImageNames(content) {
  const matches = [...content.matchAll(/https?:\/\/justinj\.eu\.org\/wp-content\/uploads\/(?:[^/"']+\/)+([^/"')\s?]+)/gi)];
  return [...new Set(matches.map((match) => stripSizeSuffix(match[1])))];
}

function replaceUploadUrls(content, pageDepth) {
  return content.replace(
    /https?:\/\/justinj\.eu\.org\/wp-content\/uploads\/(?:[^/"']+\/)+([^/"')\s?]+)/gi,
    (_match, fileName) => `${"../".repeat(pageDepth)}assets/media/messages/${stripSizeSuffix(fileName)}`
  );
}

function extractAuthor(title, content) {
  const titleMatch = title.match(/（(.+?)）/);
  if (titleMatch) {
    return titleMatch[1];
  }

  const contentMatch = content.match(/——\s*([^\n<]+)/);
  if (contentMatch) {
    return contentMatch[1].trim();
  }

  return "佚名";
}

function buildMessages(rows) {
  const outputDir = path.join(outputMediaDir, "messages");
  ensureDir(outputDir);

  const messages = rows
    .filter((row) => messagePostIds.includes(row.ID))
    .sort((left, right) => new Date(left.post_date) - new Date(right.post_date))
    .map((row) => {
      const imageNames = extractImageNames(row.post_content);
      for (const imageName of imageNames) {
        copyMedia(imageName, outputDir);
      }

      const localizedContent = replaceUploadUrls(row.post_content, 1);
      const rawContent = formatRichText(localizedContent);

      return {
        id: row.ID,
        title: row.post_title.replace(/（.+?）/, "").trim(),
        fullTitle: row.post_title.trim(),
        author: extractAuthor(row.post_title, row.post_content),
        date: formatDate(row.post_date),
        contentHtml: rawContent,
      };
    });

  fs.writeFileSync(
    path.join(outputDataDir, "messages.js"),
    `window.__MEMORY_MESSAGES__ = ${JSON.stringify(messages, null, 2)};\n`,
    "utf8"
  );
}

function extractGalleryImage(content) {
  const hrefMatch = content.match(/href="https?:\/\/justinj\.eu\.org\/wp-content\/uploads\/(?:[^/"']+\/)+([^/"']+)"/i);
  if (hrefMatch) {
    return stripSizeSuffix(hrefMatch[1]);
  }

  const srcMatch = content.match(/src="https?:\/\/justinj\.eu\.org\/wp-content\/uploads\/(?:[^/"']+\/)+([^/"']+)"/i);
  if (srcMatch) {
    return stripSizeSuffix(srcMatch[1]);
  }

  return null;
}

function buildGallery(rows) {
  const familyDir = path.join(outputMediaDir, "gallery", "family");
  const schoolDir = path.join(outputMediaDir, "gallery", "school");
  ensureDir(familyDir);
  ensureDir(schoolDir);

  const familyEntries = fs
    .readdirSync(path.join(uploadsDir, "wppa-source", "album-1"))
    .filter((file) => /\.(jpg|jpeg|png)$/i.test(file))
    .sort((left, right) => left.localeCompare(right, "en", { numeric: true }))
    .map((fileName, index) => {
      const destinationPath = copyMedia(fileName, familyDir);
      return {
        title: `旧影 ${String(index + 1).padStart(2, "0")}`,
        image: `../${toPublicPath(destinationPath)}`,
        caption: "家庭与成长时期的扫描留影",
      };
    });

  const schoolEntries = rows
    .filter((row) => galleryPostIds.includes(row.ID))
    .map((row) => {
      const imageName = extractGalleryImage(row.post_content);
      if (!imageName) {
        return null;
      }

      const destinationPath = copyMedia(imageName, schoolDir);
      return {
        title: row.post_title.trim(),
        image: `../${toPublicPath(destinationPath)}`,
        caption: "校园时期的留影",
      };
    })
    .filter(Boolean);

  const gallery = [
    {
      slug: "family",
      title: "旧影扫描",
      description: "家庭与成长照片",
      entries: familyEntries,
    },
    {
      slug: "school",
      title: "校园留影",
      description: "校园照片。",
      entries: schoolEntries,
    },
  ];

  fs.writeFileSync(
    path.join(outputDataDir, "gallery.js"),
    `window.__MEMORY_GALLERY__ = ${JSON.stringify(gallery, null, 2)};\n`,
    "utf8"
  );
}

function buildVideos(rows) {
  const sourceLabel = (url) => {
    if (url.includes("youku.com")) return "优酷";
    if (url.includes("tudou.com")) return "土豆";
    return "外部链接";
  };

  const videos = videoPostIds
    .map((id) => rows.find((row) => row.ID === id))
    .filter(Boolean)
    .map((row) => {
      const match = row.post_content.match(/https?:\/\/[^\s"<]+/i);
      const url = match ? match[0] : "";
      return {
        title: row.post_title.trim(),
        url,
        source: sourceLabel(url),
        year: row.post_date.slice(0, 4),
      };
    });

  fs.writeFileSync(
    path.join(outputDataDir, "videos.js"),
    `window.__MEMORY_VIDEOS__ = ${JSON.stringify(videos, null, 2)};\n`,
    "utf8"
  );
}

function copyHeroImage() {
  const homeDir = path.join(outputMediaDir, "home");
  ensureDir(homeDir);
  const source = path.join(tmpDir, "home-hero-image.jpg");
  const destination = path.join(homeDir, "hero.jpg");
  fs.copyFileSync(source, destination);
}

function build() {
  ensureDir(outputDataDir);
  resetDir(outputMediaDir);
  copyHeroImage();

  const rows = readCsvRows();
  buildMessages(rows);
  buildGallery(rows);
  buildVideos(rows);
}

build();
