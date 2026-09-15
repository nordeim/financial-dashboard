#!/usr/bin/env python3
"""
ssh_git_wrapper_v3.py — push to GitHub over SSH with an externally-supplied key.

Why this exists
---------------
The repo's canonical remote for pushes is the SSH URL
(`git@github.com:nordeim/design-brand-strategy.git`), but cloning happens over
HTTPS and sandbox/CI environments rarely have a resident `~/.ssh` identity.
This wrapper lets an operator push without permanently installing a key:

  1. Take an OpenSSH private key from a file, stdin, or the `SSH_KEY` env var
     (NEVER from a file committed inside the repo — the .gitignore already
     rejects `*.key` / `ssh-key.txt` for exactly this reason).
  2. Materialize it into a 0600 temp file OUTSIDE the repo.
  3. Point `GIT_SSH_COMMAND` at it (IdentitiesOnly, accept-new host keys).
  4. Push `main` (or the requested ref) to the SSH remote.
  5. Shred and remove the temp key.

Usage
-----
  # key from a file (recommended — file lives outside the repo):
  python3 docs/ssh_git_wrapper_v3.py --key-file /secure/path/to/id_ed25519

  # key piped on stdin:
  cat /secure/id_ed25519 | python3 docs/ssh_git_wrapper_v3.py --key-stdin

  # key from an environment variable:
  SSH_KEY="$(cat /secure/id_ed25519)" python3 docs/ssh_git_wrapper_v3.py

Options
-------
  --remote <url>    SSH remote to push to
                    (default git@github.com:nordeim/design-brand-strategy.git)
  --branch <name>   Branch to push (default: main — the operator contract for
                    this repo is main-only, no feature branches)
  --set-url         Also persist the SSH URL as origin's push URL in .git/config
  --dry-run         Run `git push --dry-run` (key handling still exercised)
  -h / --help       This message

Exit codes: 0 success · 1 usage error · 2 key materialization error ·
3 git error · 4 push rejected/failed.

See docs/how-to-git-push-using-ssh-wrapper_SKILL.md for the operator runbook.
"""

from __future__ import annotations

import argparse
import os
import stat
import subprocess
import sys
import tempfile

DEFAULT_REMOTE = "git@github.com:nordeim/design-brand-strategy.git"
DEFAULT_BRANCH = "main"
KEY_MARKER = "-----BEGIN OPENSSH PRIVATE KEY-----"


def die(code: int, message: str) -> None:
    print(f"[ssh-git-wrapper] ERROR: {message}", file=sys.stderr)
    sys.exit(code)


def read_key(args: argparse.Namespace) -> str:
    """Collect the private key from whichever source was requested."""
    key = ""
    if args.key_file:
        try:
            with open(os.path.abspath(args.key_file), "r", encoding="utf-8") as handle:
                key = handle.read()
        except OSError as exc:
            die(2, f"cannot read --key-file {args.key_file}: {exc}")
    elif args.key_stdin:
        if sys.stdin.isatty():
            die(1, "--key-stdin given but stdin is a terminal — pipe the key in")
        key = sys.stdin.read()
    elif os.environ.get("SSH_KEY"):
        key = os.environ["SSH_KEY"]
    else:
        die(1, "no key source: pass --key-file PATH, --key-stdin, or set $SSH_KEY")

    key = key.strip() + "\n"
    if KEY_MARKER not in key:
        die(2, "key does not look like an OpenSSH private key (missing BEGIN marker)")
    return key


def materialize_key(key: str) -> str:
    """Write the key to a 0600 temp file outside the repository."""
    file_descriptor, path = tempfile.mkstemp(prefix="dbs-push-", suffix=".key", dir="/tmp")
    try:
        with os.fdopen(file_descriptor, "w", encoding="utf-8") as handle:
            handle.write(key)
        os.chmod(path, stat.S_IRUSR | stat.S_IWUSR)  # 0600 — ssh refuses wider
    except OSError as exc:
        die(2, f"cannot materialize temp key file: {exc}")
    return path


def run(command: list[str], env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    printable = " ".join(command)
    print(f"[ssh-git-wrapper] $ {printable}")
    return subprocess.run(command, env=env, text=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Push to the GitHub SSH remote using an externally-supplied deploy key.",
    )
    parser.add_argument("--key-file", help="path to an OpenSSH private key (outside the repo)")
    parser.add_argument("--key-stdin", action="store_true", help="read the key from stdin")
    parser.add_argument("--remote", default=DEFAULT_REMOTE, help=f"SSH remote (default {DEFAULT_REMOTE})")
    parser.add_argument("--branch", default=DEFAULT_BRANCH, help=f"branch to push (default {DEFAULT_BRANCH})")
    parser.add_argument("--set-url", action="store_true", help="persist the SSH URL as origin push URL")
    parser.add_argument("--dry-run", action="store_true", help="git push --dry-run")
    args = parser.parse_args()

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.isdir(os.path.join(repo_root, ".git")):
        die(3, f"{repo_root} does not look like a git repository (run from the repo checkout)")

    key = read_key(args)
    key_path = materialize_key(key)
    ssh_command = (
        f"ssh -i {key_path} -o IdentitiesOnly=yes "
        f"-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile={key_path}.known_hosts"
    )
    env = {**os.environ, "GIT_SSH_COMMAND": ssh_command}

    try:
        if args.set_url:
            configured = run(
                ["git", "remote", "get-url", "--push", "origin"],
                {**os.environ},
            )
            if args.remote not in (configured.stdout or ""):
                result = run(
                    ["git", "remote", "set-url", "--push", "origin", args.remote],
                    {**os.environ},
                )
                if result.returncode != 0:
                    die(3, "git remote set-url failed")

        push_args = ["git", "push", args.remote, f"HEAD:refs/heads/{args.branch}"]
        if args.dry_run:
            push_args.insert(2, "--dry-run")

        # Pre-flight: prove the key authenticates before attempting the push.
        ls_remote = run(
            ["git", "ls-remote", "--heads", args.remote, args.branch],
            env,
        )
        if ls_remote.returncode != 0:
            die(4, "authentication pre-flight failed (git ls-remote) — check the key and remote")

        push = run(push_args, env)
        if push.returncode != 0:
            die(4, f"git push failed (exit {push.returncode})")

        print(
            f"[ssh-git-wrapper] OK — pushed HEAD -> {args.remote} refs/heads/{args.branch}"
            + (" (dry-run)" if args.dry_run else ""),
        )
    finally:
        # Shred-then-remove: best-effort overwrite before unlink, and clean
        # the sidecar known_hosts the SSH command created.
        try:
            size = os.path.getsize(key_path)
            with open(key_path, "wb") as handle:
                handle.write(os.urandom(size))
            os.remove(key_path)
            known_hosts = f"{key_path}.known_hosts"
            if os.path.exists(known_hosts):
                os.remove(known_hosts)
            print("[ssh-git-wrapper] temp key material shredded and removed")
        except OSError:
            die(2, f"failed to clean up {key_path} — remove it manually")


if __name__ == "__main__":
    main()
