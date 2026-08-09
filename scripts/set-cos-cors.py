# -*- coding: utf-8 -*-
"""
set-cos-cors.py —— 为 COS 媒体桶配置 / 校验 CORS（hls.js 跨域拉流必需）。

背景：GitHub Pages 站点用 hls.js 通过 XHR 拉取 COS 上的 .m3u8 清单与 .ts 分片，
COS 桶必须配置 CORS 放行站点 Origin，否则线上视频无法播放/切换（本地 dev 走
public/assets/videos/ 本地文件不受影响，这就是"本地能播、线上不能播"的根因）。

凭据来源：复用本机 coscli 已存凭据（coscli config show 输出解析），
不硬编码、不打印密钥、不要求你手动输入。

依赖：pip 安装腾讯官方 SDK ——  pip install cos-python-sdk-v5

用法：
  python scripts/set-cos-cors.py          # 应用 CORS 规则并验证
  python scripts/set-cos-cors.py --check  # 仅读取当前 CORS 配置
"""
import io, sys, subprocess, re, argparse

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from qcloud_cos import CosConfig, CosS3Client
from qcloud_cos.cos_exception import CosServiceError

COSCLI = r'D:\coscli-windows-386.exe'
BUCKET = 'jazimprofile-media-1465643833'
REGION = 'ap-guangzhou'

# 与 COS_CORS_GUIDE.md 保持一致的放行 Origin（生产不放开 `*`）
ALLOWED_ORIGINS = [
    'https://jazimlau.github.io',
    'https://jazimportfolio.com',
    'https://www.jazimportfolio.com',
    # 本地调试端口（vite dev 5173 / vite preview 4173）
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4173',
]

CORS_CONFIG = {
    'CORSRule': [
        {
            'ID': 'jazim-portfolio-media',
            'AllowedOrigin': ALLOWED_ORIGINS,
            'AllowedMethod': ['GET', 'HEAD'],
            'AllowedHeader': ['*'],
            'ExposeHeader': ['ETag', 'Content-Length', 'Content-Type'],
            'MaxAgeSeconds': 600,
        }
    ]
}


def get_creds():
    """从 coscli config show 解析凭据（本机已存，不打印）。"""
    p = subprocess.run([COSCLI, 'config', 'show'], capture_output=True, text=True,
                       timeout=60, encoding='utf-8', errors='replace')
    out = (p.stdout or '') + (p.stderr or '')
    vals = {}
    for line in out.splitlines():
        m = re.match(r'\s*([A-Za-z ]+?):\s*(.*?)\s*$', line)
        if m:
            vals[m.group(1).strip().lower()] = m.group(2).strip()
    sid = vals.get('secret id')
    skey = vals.get('secret key')
    stok = vals.get('session token', '') or ''
    if not sid or not skey:
        raise RuntimeError('无法从 coscli config show 解析凭据，请先运行 coscli config')
    return sid, skey, stok


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true', help='仅读取当前 CORS 配置')
    args = ap.parse_args()

    secret_id, secret_key, session_token = get_creds()
    print(f'凭据已载入（secretid 长度={len(secret_id)}，token={bool(session_token)}）')

    client = CosS3Client(CosConfig(
        Region=REGION, SecretId=secret_id, SecretKey=secret_key,
        Token=session_token or None, Scheme='https',
    ))

    try:
        cur = client.get_bucket_cors(Bucket=BUCKET)
        print('当前 CORS 配置：')
        print(cur)
    except CosServiceError as e:
        print(f'读取 CORS 失败：{e.get_status_code()} {e.get_error_code()}'
              f'（NoSuchCORSConfiguration 表示从未配置）')

    if args.check:
        return

    print('写入 CORS 规则...')
    try:
        client.put_bucket_cors(Bucket=BUCKET, CORSConfiguration=CORS_CONFIG)
        print('PUT CORS 成功')
    except CosServiceError as e:
        print(f'PUT CORS 失败：{e.get_status_code()} {e.get_error_code()}')
        print(e.get_error_body())
        sys.exit(1)

    print('验证...')
    try:
        cur = client.get_bucket_cors(Bucket=BUCKET)
        print('已生效：')
        print(cur)
    except CosServiceError as e:
        print(f'验证失败：{e.get_status_code()} {e.get_error_code()}')
        sys.exit(1)


if __name__ == '__main__':
    main()
