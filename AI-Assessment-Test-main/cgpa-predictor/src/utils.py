import subprocess

def run_script(script_name, args=None):
    """
    Runs a Python script and returns (stdout, stderr)
    """
    cmd = ["python", script_name]
    if args:
        cmd.extend(args)

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True
    )
    return result.stdout, result.stderr
