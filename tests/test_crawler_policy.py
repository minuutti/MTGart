import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class CrawlerPolicyTest(unittest.TestCase):
    def test_gallery_and_quiz_pages_request_no_index(self):
        for path in (ROOT / "index.html", ROOT / "quiz" / "index.html"):
            with self.subTest(path=path):
                html = path.read_text(encoding="utf-8")
                self.assertRegex(
                    html,
                    re.compile(
                        r'<meta\s+name=["\']robots["\']\s+'
                        r'content=["\']noindex,\s*nofollow,\s*noarchive,\s*nosnippet["\']',
                        re.IGNORECASE,
                    ),
                )

    def test_robots_policy_blocks_ai_and_unknown_crawlers(self):
        policy = (ROOT / "robots.txt").read_text(encoding="utf-8")
        for agent in ("GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot",
                      "Bytespider", "CCBot", "Google-Extended", "Applebot-Extended"):
            with self.subTest(agent=agent):
                self.assertRegex(
                    policy,
                    rf"(?im)^User-agent:\s*{re.escape(agent)}\s*$[\s\S]*?^Disallow:\s*/\s*$",
                )
        self.assertRegex(
            policy,
            r"(?im)^User-agent:\s*\*\s*$[\s\S]*?^Disallow:\s*/\s*$",
        )

    def test_search_crawlers_can_read_noindex_pages(self):
        policy = (ROOT / "robots.txt").read_text(encoding="utf-8")
        for agent in ("Googlebot", "Bingbot", "DuckDuckBot"):
            with self.subTest(agent=agent):
                self.assertRegex(
                    policy,
                    rf"(?im)^User-agent:\s*{re.escape(agent)}\s*$[\s\S]*?^Allow:\s*/\s*$",
                )


if __name__ == "__main__":
    unittest.main()
