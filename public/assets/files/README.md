# 文件资源目录

| 文件名 | 用途 |
|---|---|
| `Jazim-Lau-CV.pdf` | 简历。Hero、Profile、Contact 三处的 DOWNLOAD CV 按钮都指向它 |

路径在 `src/data/profile.ts` 的 `cvPath` 字段，改名字就改那里。
文件不存在时按钮仍然存在且可点击（浏览器会提示找不到文件），不会破坏布局。
