using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace FmbDiffMergeHost
{
    internal static class Program
    {
        [STAThread]
        static void Main()
        {
            ApplicationConfiguration.Initialize();

            // Requirement 10: Detect if Microsoft Edge WebView2 Runtime is available
            if (!IsWebView2RuntimeInstalled(out string versionInfo))
            {
                MessageBox.Show(
                    "Microsoft Edge WebView2 Runtime was not found on this Windows installation.\n\n" +
                    "FMB Diff & Merge Checker requires the standard Windows WebView2 Runtime to display its interface.\n\n" +
                    "Please install the Microsoft Edge WebView2 Evergreen Runtime from your internal IT software portal or Microsoft.",
                    "FMB Diff & Merge Checker — WebView2 Runtime Missing",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                Environment.Exit(1);
                return;
            }

            Application.Run(new MainHostForm(versionInfo));
        }

        private static bool IsWebView2RuntimeInstalled(out string version)
        {
            version = string.Empty;
            try
            {
                version = CoreWebView2Environment.GetAvailableBrowserVersionString();
                return !string.IsNullOrWhiteSpace(version);
            }
            catch
            {
                return false;
            }
        }
    }

    public sealed class MainHostForm : Form
    {
        private readonly WebView2 _webView;
        private Process? _nodeProcess;
        private int _boundPort;
        private static readonly HttpClient Http = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };

        public MainHostForm(string webView2Version)
        {
            Text = "FMB Diff & Merge Checker";
            Width = 1440;
            Height = 900;
            MinimumSize = new Size(1024, 680);
            StartPosition = FormStartPosition.CenterScreen;
            BackColor = Color.FromArgb(20, 21, 23);

            _webView = new WebView2
            {
                Dock = DockStyle.Fill,
                DefaultBackgroundColor = Color.FromArgb(20, 21, 23)
            };

            Controls.Add(_webView);

            Load += async (_, _) => await InitializeHostAsync();
            FormClosing += (_, _) => StopNodeServer();
        }

        private async Task InitializeHostAsync()
        {
            try
            {
                // Requirement 3: Automatically select an available local port on 127.0.0.1
                _boundPort = GetAvailableLoopbackPort();

                // Start the local Node.js server bound to 127.0.0.1:<port>
                StartNodeServer(_boundPort);

                // Wait for http://127.0.0.1:<port>/api/health to become ready
                string baseUrl = $"http://127.0.0.1:{_boundPort}";
                bool ready = await WaitForServerReadyAsync($"{baseUrl}/api/health", TimeSpan.FromSeconds(15));

                if (!ready)
                {
                    MessageBox.Show(
                        $"The local Node.js application server failed to respond on {baseUrl}.\n\n" +
                        "Ensure Node.js is installed and the application files (server.js / dist) are present.",
                        "FMB Diff & Merge Checker — Local Server Startup Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    Close();
                    return;
                }

                string userDataFolder = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "FmbDiffMergeChecker",
                    "WebView2Data"
                );

                var env = await CoreWebView2Environment.CreateAsync(null, userDataFolder);
                await _webView.EnsureCoreWebView2Async(env);

                // Harden WebView2 settings for internal desktop developer tool
                _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
                _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                _webView.CoreWebView2.Settings.IsZoomControlEnabled = true;

                _webView.CoreWebView2.Navigate(baseUrl);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    $"Failed to initialize the WebView2 desktop host:\n\n{ex.Message}",
                    "FMB Diff & Merge Checker — Initialization Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
                Close();
            }
        }

        private static int GetAvailableLoopbackPort()
        {
            using var listener = new TcpListener(IPAddress.Loopback, 0);
            listener.Start();
            int port = ((IPEndPoint)listener.LocalEndpoint).Port;
            listener.Stop();
            return port;
        }

        private void StartNodeServer(int port)
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string compiledServerJs = Path.Combine(appDir, "server.js");
            string rootServerJs = Path.GetFullPath(Path.Combine(appDir, "..", "server.js"));

            string workingDir = appDir;
            string arguments;

            if (File.Exists(compiledServerJs))
            {
                arguments = $"\"{compiledServerJs}\"";
            }
            else if (File.Exists(rootServerJs))
            {
                workingDir = Path.GetDirectoryName(rootServerJs)!;
                arguments = $"\"{rootServerJs}\"";
            }
            else
            {
                // Dev mode fallback: run server.ts from repository root
                workingDir = Path.GetFullPath(Path.Combine(appDir, ".."));
                arguments = "import(\"tsx/esm\") server.ts";
            }

            var psi = new ProcessStartInfo
            {
                FileName = "node",
                Arguments = arguments,
                WorkingDirectory = workingDir,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true
            };

            psi.Environment["WEBVIEW2_HOST"] = "1";
            psi.Environment["NODE_ENV"] = "production";
            psi.Environment["PORT"] = port.ToString();

            _nodeProcess = Process.Start(psi);
        }

        private static async Task<bool> WaitForServerReadyAsync(string healthUrl, TimeSpan timeout)
        {
            var sw = Stopwatch.StartNew();
            while (sw.Elapsed < timeout)
            {
                try
                {
                    using var res = await Http.GetAsync(healthUrl);
                    if (res.IsSuccessStatusCode)
                    {
                        return true;
                    }
                }
                catch
                {
                    // Server still starting up
                }
                await Task.Delay(120);
            }
            return false;
        }

        private void StopNodeServer()
        {
            if (_boundPort > 0)
            {
                try
                {
                    using var _ = Http.PostAsync($"http://127.0.0.1:{_boundPort}/api/shutdown", null).Result;
                }
                catch
                {
                    // Ignore if already stopped
                }
            }

            try
            {
                if (_nodeProcess != null && !_nodeProcess.HasExited)
                {
                    _nodeProcess.Kill(entireProcessTree: true);
                    _nodeProcess.Dispose();
                    _nodeProcess = null;
                }
            }
            catch
            {
                // Process already terminated
            }
        }
    }
}
