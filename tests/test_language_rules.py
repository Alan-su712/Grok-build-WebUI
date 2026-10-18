import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class LanguageRuleTests(unittest.TestCase):
    def test_rules_follow_all_supported_interface_locales(self):
        expected = {
            "zh-CN": "简体中文",
            "zh-TW": "繁體中文（台灣）",
            "zh-TW-TW": "繁體中文（台灣）",
            "zh-HK": "繁體中文（香港）",
            "en": "English",
            "ja": "日本語",
            "de": "Deutsch",
            "fr": "français",
            "es": "español",
            "ko": "한국어",
        }
        original = server.STATE.get("lang")
        try:
            for locale, language in expected.items():
                with self.subTest(locale=locale):
                    server.STATE["lang"] = locale
                    self.assertIn(language, server.language_rule())
        finally:
            server.STATE["lang"] = original


class RuntimePathTests(unittest.TestCase):
    def test_grok_binary_name_matches_the_platform(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            binary = root / "bin" / "grok"
            binary.parent.mkdir()
            binary.touch()
            previous_root = server.GROK_HOME
            try:
                server.GROK_HOME = root
                with patch.dict(server.os.environ, {"GROK_BIN": ""}):
                    with patch.object(server.sys, "platform", "darwin"):
                        self.assertEqual(server.grok_bin(), str(binary))
            finally:
                server.GROK_HOME = previous_root

    def test_grok_executable_keeps_windows_suffix(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            binary = root / "bin" / "grok.exe"
            binary.parent.mkdir()
            binary.touch()
            previous_root = server.GROK_HOME
            try:
                server.GROK_HOME = root
                with patch.dict(server.os.environ, {"GROK_BIN": ""}):
                    with patch.object(server.sys, "platform", "win32"):
                        self.assertEqual(server.grok_bin(), str(binary))
            finally:
                server.GROK_HOME = previous_root


class LanguagePromptTests(unittest.TestCase):
    def test_each_prompt_carries_the_current_language_rule(self):
        bridge = object.__new__(server.AcpBridge)
        requests = []
        bridge.request = lambda method, params, timeout: requests.append((method, params)) or {}
        original = server.STATE.get("lang")
        try:
            server.STATE["lang"] = "ja"
            bridge.prompt("session-id", "こんにちは")
            self.assertEqual(requests[0][0], "session/prompt")
            self.assertIn("日本語", requests[0][1]["_meta"]["rules"])
        finally:
            server.STATE["lang"] = original


if __name__ == "__main__":
    unittest.main()
