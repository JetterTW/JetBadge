import http.server
import socketserver
import webbrowser
import os
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, format, *args):
        # 簡化控制台輸出
        sys.stdout.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))

def find_available_port(start_port):
    import socket
    port = start_port
    while port < start_port + 50:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
            port += 1
    return start_port

def run():
    os.chdir(DIRECTORY)
    port = find_available_port(PORT)
    url = f"http://localhost:{port}"

    print("=" * 60)
    print(" ⚡ 電子徽章 (JetBadge) 管理控制台")
    print(f" 本地服務器已啟動: {url}")
    print(" 正在自動為您在預設瀏覽器 (Chrome / Edge) 中開啟頁面...")
    print(" 按 Ctrl + C 可結束服務器")
    print("=" * 60)

    # 在新執行緒或延遲後開啟瀏覽器
    webbrowser.open(url)

    with socketserver.TCPServer(("", port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服務器已停止。")

if __name__ == "__main__":
    run()
