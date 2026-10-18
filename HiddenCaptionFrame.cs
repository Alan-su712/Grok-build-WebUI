using System;
using System.Collections.Generic;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace GrokBuildWindow
{
    public static class HiddenCaptionFrame
    {
        private static readonly Dictionary<IntPtr, RootFrame> Roots = new Dictionary<IntPtr, RootFrame>();

        public static bool Install(IntPtr hwnd)
        {
            if (hwnd == IntPtr.Zero)
            {
                return false;
            }

            RootFrame existing;
            if (Roots.TryGetValue(hwnd, out existing))
            {
                existing.ApplyFrame();
                existing.RefreshChildren();
                return true;
            }

            RootFrame root = new RootFrame(hwnd);
            root.AssignHandle(hwnd);
            root.ApplyFrame();
            Roots[hwnd] = root;
            root.RefreshChildren();
            return true;
        }

        public static bool Refresh(IntPtr hwnd)
        {
            RootFrame root;
            if (!Roots.TryGetValue(hwnd, out root))
            {
                return Install(hwnd);
            }

            root.RefreshChildren();
            return true;
        }

        private sealed class RootFrame : NativeWindow
        {
            private readonly IntPtr _hwnd;
            private readonly Dictionary<IntPtr, ChildFrame> _children = new Dictionary<IntPtr, ChildFrame>();
            private readonly List<ResizeOverlay> _overlays = new List<ResizeOverlay>();

            internal RootFrame(IntPtr hwnd)
            {
                _hwnd = hwnd;
            }

            internal void ApplyFrame()
            {
                long style = GetWindowLongPtr(_hwnd, GWL_STYLE).ToInt64();
                // 保留 WS_CAPTION，只把非客户区尺寸压为零。这样 DWM 仍能识别标准窗口状态，
                // 最小化、还原、最大化和任务栏恢复动画继续由 Windows 处理。
                style |= WS_CAPTION | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX | WS_SYSMENU;
                SetWindowLongPtr(_hwnd, GWL_STYLE, new IntPtr(style));

                int corner = DWMWCP_ROUND;
                DwmSetWindowAttribute(_hwnd, DWMWA_WINDOW_CORNER_PREFERENCE, ref corner, sizeof(int));

                SetWindowPos(
                    _hwnd,
                    IntPtr.Zero,
                    0,
                    0,
                    0,
                    0,
                    SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE | SWP_FRAMECHANGED
                );
            }

            internal void RefreshChildren()
            {
                EnsureResizeOverlays();
                EnumChildWindows(_hwnd, delegate (IntPtr child, IntPtr unused)
                {
                    if (child == IntPtr.Zero || _children.ContainsKey(child))
                    {
                        return true;
                    }

                    uint processId;
                    GetWindowThreadProcessId(child, out processId);
                    if (processId != GetCurrentProcessId() || !IsWindowVisible(child))
                    {
                        return true;
                    }

                    RECT rect;
                    if (!GetWindowRect(child, out rect) || rect.Right - rect.Left < 120 || rect.Bottom - rect.Top < 120)
                    {
                        return true;
                    }

                    ChildFrame frame = new ChildFrame(_hwnd, child);
                    frame.AssignHandle(child);
                    _children[child] = frame;
                    return true;
                }, IntPtr.Zero);
            }

            private void EnsureResizeOverlays()
            {
                if (_overlays.Count == 0)
                {
                    _overlays.Add(new ResizeOverlay(_hwnd, HTLEFT));
                    _overlays.Add(new ResizeOverlay(_hwnd, HTRIGHT));
                    _overlays.Add(new ResizeOverlay(_hwnd, HTTOP));
                    _overlays.Add(new ResizeOverlay(_hwnd, HTBOTTOM));
                    _overlays.Add(new ResizeOverlay(_hwnd, HTTOPLEFT));
                    _overlays.Add(new ResizeOverlay(_hwnd, HTTOPRIGHT));
                    _overlays.Add(new ResizeOverlay(_hwnd, HTBOTTOMLEFT));
                    _overlays.Add(new ResizeOverlay(_hwnd, HTBOTTOMRIGHT));
                }
                LayoutResizeOverlays();
            }

            private void LayoutResizeOverlays()
            {
                if (_overlays.Count < 8)
                {
                    return;
                }

                RECT rect;
                if (!GetClientRect(_hwnd, out rect)) return;
                int width = rect.Right - rect.Left;
                int height = rect.Bottom - rect.Top;
                int border = Math.Min(ResizeBorder(_hwnd), Math.Min(width / 3, height / 3));
                if (border < 4) return;

                _overlays[0].Layout(0, border, border, Math.Max(0, height - border * 2));
                _overlays[1].Layout(Math.Max(0, width - border), border, border, Math.Max(0, height - border * 2));
                _overlays[2].Layout(border, 0, Math.Max(0, width - border * 2), border);
                _overlays[3].Layout(border, Math.Max(0, height - border), Math.Max(0, width - border * 2), border);
                _overlays[4].Layout(0, 0, border, border);
                _overlays[5].Layout(Math.Max(0, width - border), 0, border, border);
                _overlays[6].Layout(0, Math.Max(0, height - border), border, border);
                _overlays[7].Layout(Math.Max(0, width - border), Math.Max(0, height - border), border, border);
            }

            protected override void WndProc(ref Message message)
            {
                switch (message.Msg)
                {
                    case WM_NCCALCSIZE:
                        message.Result = IntPtr.Zero;
                        return;
                    case WM_GETMINMAXINFO:
                        UpdateMinMaxInfo(_hwnd, message.LParam);
                        message.Result = IntPtr.Zero;
                        return;
                    case WM_NCHITTEST:
                        message.Result = new IntPtr(HitTestRoot(_hwnd, message.LParam));
                        return;
                    case WM_NCACTIVATE:
                        message.Result = new IntPtr(1);
                        return;
                    case WM_ERASEBKGND:
                        message.Result = new IntPtr(1);
                        return;
                    case WM_SIZE:
                        LayoutResizeOverlays();
                        break;
                    case WM_WINDOWPOSCHANGED:
                        LayoutResizeOverlays();
                        break;
                    case WM_DPICHANGED:
                        LayoutResizeOverlays();
                        break;
                    case WM_DESTROY:
                        foreach (ResizeOverlay overlay in _overlays)
                        {
                            overlay.ReleaseHandle();
                        }
                        _overlays.Clear();
                        foreach (ChildFrame child in _children.Values)
                        {
                            child.ReleaseHandle();
                        }
                        _children.Clear();
                        break;
                }

                base.WndProc(ref message);
            }
        }

        private sealed class ResizeOverlay
        {
            private sealed class State
            {
                internal IntPtr Root;
                internal int Hit;
                internal IntPtr OriginalProc;
            }

            private static readonly Dictionary<IntPtr, State> States = new Dictionary<IntPtr, State>();
            private static readonly WndProcDelegate WndProcCallback = OverlayWndProc;
            private readonly IntPtr _hwnd;
            private readonly IntPtr _originalProc;

            internal ResizeOverlay(IntPtr root, int hit)
            {
                _hwnd = CreateWindowEx(
                    WS_EX_NOACTIVATE | WS_EX_TRANSPARENT,
                    "STATIC",
                    "",
                    WS_CHILD | WS_VISIBLE,
                    0,
                    0,
                    1,
                    1,
                    root,
                    IntPtr.Zero,
                    IntPtr.Zero,
                    IntPtr.Zero
                );
                if (_hwnd == IntPtr.Zero)
                {
                    throw new InvalidOperationException("resize overlay handle creation failed");
                }
                _originalProc = SetWindowLongPtr(_hwnd, GWL_WNDPROC, Marshal.GetFunctionPointerForDelegate(WndProcCallback));
                States[_hwnd] = new State
                {
                    Root = root,
                    Hit = hit,
                    OriginalProc = _originalProc
                };
            }

            internal void Layout(int x, int y, int width, int height)
            {
                SetWindowPos(_hwnd, HWND_TOP, x, y, width, height, SWP_NOACTIVATE | SWP_SHOWWINDOW);
            }

            internal void ReleaseHandle()
            {
                if (_hwnd == IntPtr.Zero) return;
                States.Remove(_hwnd);
                SetWindowLongPtr(_hwnd, GWL_WNDPROC, _originalProc);
                DestroyWindow(_hwnd);
            }

            private static IntPtr OverlayWndProc(IntPtr hwnd, int message, IntPtr wParam, IntPtr lParam)
            {
                State state;
                if (!States.TryGetValue(hwnd, out state))
                {
                    return IntPtr.Zero;
                }

                switch (message)
                {
                    case WM_NCHITTEST:
                        return new IntPtr(state.Hit);
                    case WM_NCLBUTTONDOWN:
                    case WM_LBUTTONDOWN:
                        ReleaseCapture();
                        SendMessage(state.Root, WM_NCLBUTTONDOWN, new IntPtr(state.Hit), lParam);
                        return IntPtr.Zero;
                    case WM_SETCURSOR:
                        SetResizeCursor(state.Hit);
                        return new IntPtr(1);
                    case WM_MOUSEACTIVATE:
                        return new IntPtr(MA_ACTIVATE);
                    case WM_ERASEBKGND:
                    case WM_PAINT:
                        ValidateRect(hwnd, IntPtr.Zero);
                        return IntPtr.Zero;
                    case WM_NCDESTROY:
                        States.Remove(hwnd);
                        break;
                }

                return CallWindowProc(state.OriginalProc, hwnd, message, wParam, lParam);
            }
        }

        private sealed class ChildFrame : NativeWindow
        {
            private readonly IntPtr _root;
            private readonly IntPtr _hwnd;

            internal ChildFrame(IntPtr root, IntPtr hwnd)
            {
                _root = root;
                _hwnd = hwnd;
            }

            protected override void WndProc(ref Message message)
            {
                switch (message.Msg)
                {
                    case WM_NCHITTEST:
                        int hit = HitTestResize(_root, message.LParam);
                        if (hit != HTCLIENT)
                        {
                            message.Result = new IntPtr(hit);
                            return;
                        }
                        break;
                    case WM_NCLBUTTONDOWN:
                        if (IsResizeHit(message.WParam.ToInt32()))
                        {
                            ReleaseCapture();
                            SendMessage(_root, WM_NCLBUTTONDOWN, message.WParam, message.LParam);
                            message.Result = IntPtr.Zero;
                            return;
                        }
                        break;
                    case WM_SETCURSOR:
                        int cursorHit = HitTestResize(_root, GetCursorScreenPoint());
                        if (SetResizeCursor(cursorHit))
                        {
                            message.Result = new IntPtr(1);
                            return;
                        }
                        break;
                }

                base.WndProc(ref message);
            }

            private static IntPtr GetCursorScreenPoint()
            {
                POINT point;
                GetCursorPos(out point);
                long packed = (long)((point.Y << 16) | (point.X & 0xffff));
                return new IntPtr(packed);
            }
        }

        private static int HitTestRoot(IntPtr hwnd, IntPtr lParam)
        {
            int resizeHit = HitTestResize(hwnd, lParam);
            if (resizeHit != HTCLIENT)
            {
                return resizeHit;
            }

            RECT rect;
            if (GetWindowRect(hwnd, out rect))
            {
                POINT point = PointFromLParam(lParam);
                int headerHeight = Scale(hwnd, 56);
                if (point.Y >= rect.Top && point.Y < rect.Top + headerHeight)
                {
                    return HTCAPTION;
                }
            }

            return HTCLIENT;
        }

        private static int HitTestResize(IntPtr hwnd, IntPtr lParam)
        {
            if (IsZoomed(hwnd))
            {
                return HTCLIENT;
            }

            RECT rect;
            if (!GetWindowRect(hwnd, out rect))
            {
                return HTCLIENT;
            }

            POINT point = PointFromLParam(lParam);
            int border = ResizeBorder(hwnd);
            bool left = point.X >= rect.Left && point.X < rect.Left + border;
            bool right = point.X < rect.Right && point.X >= rect.Right - border;
            bool top = point.Y >= rect.Top && point.Y < rect.Top + border;
            bool bottom = point.Y < rect.Bottom && point.Y >= rect.Bottom - border;

            if (left && top) return HTTOPLEFT;
            if (right && top) return HTTOPRIGHT;
            if (left && bottom) return HTBOTTOMLEFT;
            if (right && bottom) return HTBOTTOMRIGHT;
            if (left) return HTLEFT;
            if (right) return HTRIGHT;
            if (top) return HTTOP;
            if (bottom) return HTBOTTOM;
            return HTCLIENT;
        }

        private static bool IsResizeHit(int hit)
        {
            return hit >= HTLEFT && hit <= HTBOTTOMRIGHT;
        }

        private static bool SetResizeCursor(int hit)
        {
            IntPtr cursor = IntPtr.Zero;
            if (hit == HTLEFT || hit == HTRIGHT) cursor = LoadCursor(IntPtr.Zero, IDC_SIZEWE);
            else if (hit == HTTOP || hit == HTBOTTOM) cursor = LoadCursor(IntPtr.Zero, IDC_SIZENS);
            else if (hit == HTTOPLEFT || hit == HTBOTTOMRIGHT) cursor = LoadCursor(IntPtr.Zero, IDC_SIZENWSE);
            else if (hit == HTTOPRIGHT || hit == HTBOTTOMLEFT) cursor = LoadCursor(IntPtr.Zero, IDC_SIZENESW);
            if (cursor == IntPtr.Zero) return false;
            SetCursor(cursor);
            return true;
        }

        private static int ResizeBorder(IntPtr hwnd)
        {
            uint dpi = GetDpiForWindow(hwnd);
            if (dpi == 0) dpi = 96;
            int frame = GetSystemMetricsForDpi(SM_CXSIZEFRAME, dpi);
            int pad = GetSystemMetricsForDpi(SM_CXPADDEDBORDER, dpi);
            return Math.Max(8, frame + pad);
        }

        private static int Scale(IntPtr hwnd, int logicalPixels)
        {
            uint dpi = GetDpiForWindow(hwnd);
            if (dpi == 0) dpi = 96;
            return (int)Math.Round(logicalPixels * dpi / 96.0);
        }

        private static POINT PointFromLParam(IntPtr lParam)
        {
            long packed = lParam.ToInt64();
            return new POINT
            {
                X = unchecked((short)(packed & 0xffff)),
                Y = unchecked((short)((packed >> 16) & 0xffff))
            };
        }

        private static void UpdateMinMaxInfo(IntPtr hwnd, IntPtr lParam)
        {
            if (lParam == IntPtr.Zero) return;
            MINMAXINFO info = (MINMAXINFO)Marshal.PtrToStructure(lParam, typeof(MINMAXINFO));
            IntPtr monitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST);
            MONITORINFO monitorInfo = new MONITORINFO();
            monitorInfo.cbSize = Marshal.SizeOf(typeof(MONITORINFO));
            if (monitor != IntPtr.Zero && GetMonitorInfo(monitor, ref monitorInfo))
            {
                info.ptMaxPosition = new POINT
                {
                    X = monitorInfo.rcWork.Left - monitorInfo.rcMonitor.Left,
                    Y = monitorInfo.rcWork.Top - monitorInfo.rcMonitor.Top
                };
                info.ptMaxSize = new POINT
                {
                    X = monitorInfo.rcWork.Right - monitorInfo.rcWork.Left,
                    Y = monitorInfo.rcWork.Bottom - monitorInfo.rcWork.Top
                };
            }
            Marshal.StructureToPtr(info, lParam, false);
        }

        private const int GWL_STYLE = -16;
        private const long WS_CAPTION = 0x00c00000L;
        private const long WS_THICKFRAME = 0x00040000L;
        private const long WS_MINIMIZEBOX = 0x00020000L;
        private const long WS_MAXIMIZEBOX = 0x00010000L;
        private const long WS_SYSMENU = 0x00080000L;
        private const int WS_CHILD = 0x40000000;
        private const int WS_VISIBLE = 0x10000000;
        private const int WS_EX_NOACTIVATE = 0x08000000;
        private const int WS_EX_TRANSPARENT = 0x00000020;
        private const int WM_NCCALCSIZE = 0x0083;
        private const int WM_NCHITTEST = 0x0084;
        private const int WM_NCLBUTTONDOWN = 0x00a1;
        private const int WM_GETMINMAXINFO = 0x0024;
        private const int WM_NCACTIVATE = 0x0086;
        private const int WM_ERASEBKGND = 0x0014;
        private const int WM_DESTROY = 0x0002;
        private const int WM_SIZE = 0x0005;
        private const int WM_WINDOWPOSCHANGED = 0x0047;
        private const int WM_DPICHANGED = 0x02e0;
        private const int WM_LBUTTONDOWN = 0x0201;
        private const int WM_SETCURSOR = 0x0020;
        private const int WM_MOUSEACTIVATE = 0x0021;
        private const int WM_PAINT = 0x000f;
        private const int WM_NCDESTROY = 0x0082;
        private const int GWL_WNDPROC = -4;
        private const int HTCLIENT = 1;
        private const int HTCAPTION = 2;
        private const int HTLEFT = 10;
        private const int HTRIGHT = 11;
        private const int HTTOP = 12;
        private const int HTTOPLEFT = 13;
        private const int HTTOPRIGHT = 14;
        private const int HTBOTTOM = 15;
        private const int HTBOTTOMLEFT = 16;
        private const int HTBOTTOMRIGHT = 17;
        private const int SM_CXSIZEFRAME = 32;
        private const int SM_CXPADDEDBORDER = 92;
        private const int DWMWA_WINDOW_CORNER_PREFERENCE = 33;
        private const int DWMWCP_ROUND = 2;
        private const uint SWP_NOSIZE = 0x0001;
        private const uint SWP_NOMOVE = 0x0002;
        private const uint SWP_NOZORDER = 0x0004;
        private const uint SWP_NOACTIVATE = 0x0010;
        private const uint SWP_FRAMECHANGED = 0x0020;
        private const uint SWP_SHOWWINDOW = 0x0040;
        private const uint MONITOR_DEFAULTTONEAREST = 2;
        private const int MA_ACTIVATE = 1;
        private static readonly IntPtr IDC_SIZEWE = new IntPtr(32644);
        private static readonly IntPtr IDC_SIZENS = new IntPtr(32645);
        private static readonly IntPtr IDC_SIZENWSE = new IntPtr(32642);
        private static readonly IntPtr IDC_SIZENESW = new IntPtr(32643);
        private static readonly IntPtr HWND_TOP = IntPtr.Zero;

        [StructLayout(LayoutKind.Sequential)] private struct POINT { public int X; public int Y; }
        [StructLayout(LayoutKind.Sequential)] private struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
        [StructLayout(LayoutKind.Sequential)] private struct MINMAXINFO
        {
            public POINT ptReserved;
            public POINT ptMaxSize;
            public POINT ptMaxPosition;
            public POINT ptMinTrackSize;
            public POINT ptMaxTrackSize;
        }
        [StructLayout(LayoutKind.Sequential)] private struct MONITORINFO
        {
            public int cbSize;
            public RECT rcMonitor;
            public RECT rcWork;
            public int dwFlags;
        }

        [UnmanagedFunctionPointer(CallingConvention.Winapi)] private delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr lParam);
        [UnmanagedFunctionPointer(CallingConvention.Winapi)] private delegate IntPtr WndProcDelegate(IntPtr hwnd, int message, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW", SetLastError = true)] private static extern IntPtr GetWindowLongPtr64(IntPtr hwnd, int index);
        [DllImport("user32.dll", EntryPoint = "GetWindowLongW", SetLastError = true)] private static extern IntPtr GetWindowLongPtr32(IntPtr hwnd, int index);
        [DllImport("user32.dll", EntryPoint = "SetWindowLongPtrW", SetLastError = true)] private static extern IntPtr SetWindowLongPtr64(IntPtr hwnd, int index, IntPtr value);
        [DllImport("user32.dll", EntryPoint = "SetWindowLongW", SetLastError = true)] private static extern IntPtr SetWindowLongPtr32(IntPtr hwnd, int index, IntPtr value);
        [DllImport("user32.dll", SetLastError = true)] private static extern bool SetWindowPos(IntPtr hwnd, IntPtr insertAfter, int x, int y, int cx, int cy, uint flags);
        [DllImport("user32.dll")] private static extern bool EnumChildWindows(IntPtr parent, EnumWindowsProc callback, IntPtr lParam);
        [DllImport("user32.dll")] private static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);
        [DllImport("kernel32.dll")] private static extern uint GetCurrentProcessId();
        [DllImport("user32.dll")] private static extern bool IsWindowVisible(IntPtr hwnd);
        [DllImport("user32.dll")] private static extern bool GetWindowRect(IntPtr hwnd, out RECT rect);
        [DllImport("user32.dll")] private static extern bool GetClientRect(IntPtr hwnd, out RECT rect);
        [DllImport("user32.dll")] private static extern bool GetCursorPos(out POINT point);
        [DllImport("user32.dll")] private static extern IntPtr LoadCursor(IntPtr instance, IntPtr cursor);
        [DllImport("user32.dll")] private static extern IntPtr SetCursor(IntPtr cursor);
        [DllImport("user32.dll")] private static extern bool ReleaseCapture();
        [DllImport("user32.dll")] private static extern IntPtr SendMessage(IntPtr hwnd, int message, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll", CharSet = CharSet.Unicode, SetLastError = true)] private static extern IntPtr CreateWindowEx(
            int exStyle,
            string className,
            string windowName,
            int style,
            int x,
            int y,
            int width,
            int height,
            IntPtr parent,
            IntPtr menu,
            IntPtr instance,
            IntPtr param
        );
        [DllImport("user32.dll", SetLastError = true)] private static extern bool DestroyWindow(IntPtr hwnd);
        [DllImport("user32.dll")] private static extern IntPtr CallWindowProc(IntPtr previousProc, IntPtr hwnd, int message, IntPtr wParam, IntPtr lParam);
        [DllImport("user32.dll")] private static extern bool ValidateRect(IntPtr hwnd, IntPtr rect);
        [DllImport("user32.dll")] private static extern bool IsZoomed(IntPtr hwnd);
        [DllImport("user32.dll")] private static extern int GetSystemMetricsForDpi(int index, uint dpi);
        [DllImport("user32.dll")] private static extern uint GetDpiForWindow(IntPtr hwnd);
        [DllImport("user32.dll")] private static extern IntPtr MonitorFromWindow(IntPtr hwnd, uint flags);
        [DllImport("user32.dll", SetLastError = true)] private static extern bool GetMonitorInfo(IntPtr monitor, ref MONITORINFO info);
        [DllImport("dwmapi.dll")] private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attribute, ref int value, int size);

        private static IntPtr GetWindowLongPtr(IntPtr hwnd, int index)
        {
            return IntPtr.Size == 8 ? GetWindowLongPtr64(hwnd, index) : GetWindowLongPtr32(hwnd, index);
        }

        private static IntPtr SetWindowLongPtr(IntPtr hwnd, int index, IntPtr value)
        {
            return IntPtr.Size == 8 ? SetWindowLongPtr64(hwnd, index, value) : SetWindowLongPtr32(hwnd, index, value);
        }
    }
}
