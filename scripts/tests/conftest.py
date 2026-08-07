"""Shared pytest setup for the scripts unit tests.

The scripts under ``scripts/`` are written to be run as ``python3 ./scripts/foo.py``
and import each other as top-level modules (e.g. ``chart_ctl`` does ``import utils``).
Put ``scripts/`` on ``sys.path`` so the tests can import them the same way.
"""
import os
import sys

SCRIPTS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SCRIPTS_DIR not in sys.path:
    sys.path.insert(0, SCRIPTS_DIR)
