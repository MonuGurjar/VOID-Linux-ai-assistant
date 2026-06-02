import os
import shutil
import psutil
import sqlite3
import subprocess
from pathlib import Path
from typing import Dict, List
from ddgs import DDGS
from config import FILE_DB_PATH

def get_system_health_metrics() -> Dict[str, float]:
    """
    Returns a dictionary containing current system health metrics.
    Includes CPU usage (%), RAM usage (%), and Disk usage (%).
    """
    cpu = psutil.cpu_percent(interval=0.1)
    ram = psutil.virtual_memory().percent
    disk = psutil.disk_usage('/').percent
    return {
        "cpu": cpu,
        "ram": ram,
        "disk": disk
    }

def _init_db():
    conn = sqlite3.connect(FILE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT,
            filepath TEXT UNIQUE
        )
    ''')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_filename ON files(filename)')
    conn.commit()
    return conn

def update_file_index() -> str:
    """
    Indexes the home directory (visible files and specific important hidden files).
    Stores them in a local SQLite database for fast retrieval.
    """
    conn = _init_db()
    cursor = conn.cursor()
    
    home_dir = Path.home()
    
    # clear old index
    cursor.execute('DELETE FROM files')
    
    # We will walk the home directory. We skip hidden directories except .config
    count = 0
    for root, dirs, files in os.walk(home_dir):
        # Modify dirs in-place to skip hidden ones, unless it's .config directly in home
        root_path = Path(root)
        if root_path == home_dir:
            dirs[:] = [d for d in dirs if not d.startswith('.') or d == '.config']
        else:
            dirs[:] = [d for d in dirs if not d.startswith('.')]
            
        for f in files:
            # We can skip hidden files or include them. Let's include visible files
            if not f.startswith('.'):
                filepath = str(root_path / f)
                try:
                    cursor.execute('INSERT OR IGNORE INTO files (filename, filepath) VALUES (?, ?)', (f, filepath))
                    count += 1
                except sqlite3.Error:
                    pass
                    
    conn.commit()
    conn.close()
    return f"File index updated successfully. Indexed {count} files."

def search_file_index(query: str) -> List[str]:
    """
    Searches the file index for a given filename or partial filename.
    Returns a list of absolute paths matching the query.
    """
    if not FILE_DB_PATH.exists():
        return ["Error: File index does not exist. Please run update_file_index() first."]
        
    conn = sqlite3.connect(FILE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT filepath FROM files WHERE filename LIKE ? LIMIT 20', (f'%{query}%',))
    results = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    return results if results else ["No matching files found."]

def create_directory_backup(source_dir: str, dest_zip: str) -> str:
    """
    Creates a zip archive backup of a directory.
    """
    source = Path(source_dir)
    if not source.is_dir():
        return f"Error: Source directory {source_dir} does not exist or is not a directory."
        
    try:
        shutil.make_archive(dest_zip.replace('.zip', ''), 'zip', source_dir)
        return f"Backup created successfully at {dest_zip}"
    except Exception as e:
        return f"Error creating backup: {str(e)}"

def copy_file(source: str, dest: str) -> str:
    """
    Copies a file from source to dest.
    """
    try:
        shutil.copy2(source, dest)
        return f"File copied successfully from {source} to {dest}"
    except Exception as e:
        return f"Error copying file: {str(e)}"
        
def get_system_logs(service: str = "") -> str:
    """
    Fetches system logs using journalctl. Uses pkexec for authorization.
    If service is provided (e.g. 'NetworkManager'), it filters by unit.
    """
    try:
        cmd = ["pkexec", "journalctl", "-n", "50", "--no-pager"]
        if service:
            cmd.extend(["-u", service])
            
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        return f"Error fetching logs. (Authorization may have been denied or service doesn't exist). Stderr: {e.stderr}"

def execute_shell_command(command: str) -> str:
    """
    Executes a general shell command. This tool is heavily guarded by the guardrails.
    """
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=10)
        output = result.stdout if result.stdout else result.stderr
        return output if output else "Command executed with no output."
    except subprocess.TimeoutExpired:
        return "Error: Command timed out after 10 seconds."
    except Exception as e:
        return f"Error executing command: {str(e)}"

def web_search(query: str, max_results: int = 5) -> str:
    """
    Searches the internet using DuckDuckGo and returns the results.
    """
    try:
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(f"Title: {r.get('title')}\nSnippet: {r.get('body')}\nURL: {r.get('href')}")
        
        if not results:
            return "No results found."
        return "\n\n".join(results)
    except Exception as e:
        return f"Error performing web search: {str(e)}"
