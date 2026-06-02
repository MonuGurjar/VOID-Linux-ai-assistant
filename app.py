import sys
from PyQt6.QtWidgets import (QApplication, QMainWindow, QWidget, QVBoxLayout, 
                             QHBoxLayout, QTextEdit, QLineEdit, QPushButton, 
                             QLabel, QProgressBar, QGroupBox, QScrollArea, QFrame)
from PyQt6.QtCore import QTimer, Qt
from core.worker import AgentWorker
from tools.system_ops import get_system_health_metrics

# Modern Dark Theme QSS
DARK_STYLESHEET = """
QMainWindow, QWidget {
    background-color: #121212;
    color: #e0e0e0;
    font-family: "Segoe UI", "Inter", sans-serif;
    font-size: 13px;
}
QGroupBox {
    border: 1px solid #333;
    border-radius: 6px;
    margin-top: 10px;
    padding-top: 15px;
    font-weight: bold;
}
QGroupBox::title {
    subcontrol-origin: margin;
    subcontrol-position: top left;
    padding: 0 5px;
    color: #00bcd4;
}
QTextEdit, QLineEdit {
    background-color: #1e1e1e;
    border: 1px solid #333;
    border-radius: 4px;
    padding: 8px;
    color: #fff;
}
QTextEdit:focus, QLineEdit:focus {
    border: 1px solid #00bcd4;
}
QPushButton {
    background-color: #2c2c2c;
    border: 1px solid #444;
    border-radius: 4px;
    padding: 8px 16px;
    color: #fff;
    font-weight: bold;
}
QPushButton:hover {
    background-color: #3c3c3c;
    border: 1px solid #555;
}
QPushButton:pressed {
    background-color: #00bcd4;
    color: #000;
}
QProgressBar {
    border: 1px solid #333;
    border-radius: 4px;
    text-align: center;
    background-color: #1e1e1e;
    color: white;
}
QProgressBar::chunk {
    background-color: #00bcd4;
    width: 20px;
}
.approve-btn {
    background-color: #2e7d32;
}
.approve-btn:hover {
    background-color: #388e3c;
}
.deny-btn {
    background-color: #c62828;
}
.deny-btn:hover {
    background-color: #d32f2f;
}
"""

class ENMAMainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("ENMA - Evolving Neural Monitoring Agent")
        self.resize(1000, 700)
        self.setStyleSheet(DARK_STYLESHEET)
        
        self.agent_worker = AgentWorker()
        self.agent_worker.response_signal.connect(self.append_chat_message)
        self.agent_worker.batch_sensitive_action_signal.connect(self.receive_batch_actions)
        
        self.pending_actions = []
        
        self._init_ui()
        self._init_metrics_timer()
        
        self.append_chat_message("<b>[SYSTEM]</b> ENMA Initialized. Real-time metrics active. DuckDuckGo Search enabled.")
        
    def _init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        
        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(15)
        
        # Left Pane: Chat
        chat_layout = QVBoxLayout()
        
        self.chat_history = QTextEdit()
        self.chat_history.setReadOnly(True)
        self.chat_history.setAcceptRichText(True)
        chat_layout.addWidget(self.chat_history)
        
        input_layout = QHBoxLayout()
        self.user_input = QLineEdit()
        self.user_input.setPlaceholderText("Message ENMA or run a command...")
        self.user_input.returnPressed.connect(self.send_message)
        
        self.send_button = QPushButton("Send")
        self.send_button.clicked.connect(self.send_message)
        
        input_layout.addWidget(self.user_input)
        input_layout.addWidget(self.send_button)
        
        chat_layout.addLayout(input_layout)
        
        # Right Pane: Metrics & Sandbox
        right_layout = QVBoxLayout()
        right_layout.setSpacing(15)
        
        # Metrics Box
        metrics_box = QGroupBox("System Health")
        metrics_layout = QVBoxLayout(metrics_box)
        
        self.cpu_bar = QProgressBar()
        self.cpu_bar.setFormat("CPU: %p%")
        self.ram_bar = QProgressBar()
        self.ram_bar.setFormat("RAM: %p%")
        self.disk_bar = QProgressBar()
        self.disk_bar.setFormat("Disk: %p%")
        
        metrics_layout.addWidget(self.cpu_bar)
        metrics_layout.addWidget(self.ram_bar)
        metrics_layout.addWidget(self.disk_bar)
        
        right_layout.addWidget(metrics_box)
        
        # Internet Search Box
        search_box = QGroupBox("Direct Internet Action")
        search_layout = QHBoxLayout(search_box)
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search query...")
        self.search_input.returnPressed.connect(self.direct_web_search)
        self.search_btn = QPushButton("Search Web")
        self.search_btn.clicked.connect(self.direct_web_search)
        search_layout.addWidget(self.search_input)
        search_layout.addWidget(self.search_btn)
        
        right_layout.addWidget(search_box)
        
        # Batch Approval Queue
        self.queue_box = QGroupBox("Approval Queue")
        queue_layout = QVBoxLayout(self.queue_box)
        
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setStyleSheet("QScrollArea { border: none; }")
        
        self.queue_container = QWidget()
        self.queue_vbox = QVBoxLayout(self.queue_container)
        self.queue_vbox.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.scroll_area.setWidget(self.queue_container)
        
        queue_layout.addWidget(self.scroll_area)
        
        self.no_actions_label = QLabel("No pending actions.")
        self.no_actions_label.setStyleSheet("color: #777;")
        self.queue_vbox.addWidget(self.no_actions_label)
        
        right_layout.addWidget(self.queue_box)
        
        # Set stretch factors (2/3 chat, 1/3 sidebar)
        main_layout.addLayout(chat_layout, stretch=2)
        main_layout.addLayout(right_layout, stretch=1)
        
    def _init_metrics_timer(self):
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_metrics)
        self.timer.start(2000)
        self.update_metrics()
        
    def update_metrics(self):
        try:
            metrics = get_system_health_metrics()
            self.cpu_bar.setValue(int(metrics['cpu']))
            self.ram_bar.setValue(int(metrics['ram']))
            self.disk_bar.setValue(int(metrics['disk']))
        except Exception:
            pass 
            
    def direct_web_search(self):
        query = self.search_input.text().strip()
        if not query:
            return
            
        self.append_chat_message(f"<br><b>> Direct Search:</b> {query}")
        self.search_input.clear()
        
        self.send_button.setEnabled(False)
        self.user_input.setEnabled(False)
        
        self.agent_worker.finished_signal.connect(self.on_agent_finished)
        self.agent_worker.process_input(f"Please search the web for: {query}")
        
    def send_message(self):
        text = self.user_input.text().strip()
        if not text:
            return
            
        self.append_chat_message(f"<br><b>> User:</b> {text}")
        self.user_input.clear()
        
        self.send_button.setEnabled(False)
        self.user_input.setEnabled(False)
        
        self.agent_worker.finished_signal.connect(self.on_agent_finished)
        self.agent_worker.process_input(text)
        
    def on_agent_finished(self):
        self.send_button.setEnabled(True)
        self.user_input.setEnabled(True)
        self.user_input.setFocus()
        try:
            self.agent_worker.finished_signal.disconnect(self.on_agent_finished)
        except TypeError:
            pass
            
    def append_chat_message(self, message: str):
        self.chat_history.append(message)
        scrollbar = self.chat_history.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
        
    def receive_batch_actions(self, actions: list):
        self.pending_actions = actions
        
        # Clear existing widgets
        for i in reversed(range(self.queue_vbox.count())): 
            widget = self.queue_vbox.itemAt(i).widget()
            if widget:
                widget.setParent(None)
                
        if not actions:
            self.queue_vbox.addWidget(self.no_actions_label)
            return
            
        self.append_chat_message("<br><b style='color:#ff9800;'>[SYSTEM] Action(s) require approval in the Queue.</b>")
            
        for action in actions:
            frame = QFrame()
            frame.setStyleSheet("QFrame { border: 1px solid #444; border-radius: 4px; background-color: #1e1e1e; margin-bottom: 5px; }")
            layout = QVBoxLayout(frame)
            
            lbl = QLabel(f"<b>{action['name']}</b><br><span style='color:#bbb;'>{action['args']}</span>")
            lbl.setWordWrap(True)
            layout.addWidget(lbl)
            
            btn_layout = QHBoxLayout()
            
            appr_btn = QPushButton("Approve")
            appr_btn.setProperty("class", "approve-btn")
            # Apply styling fix for dynamic properties
            appr_btn.style().unpolish(appr_btn)
            appr_btn.style().polish(appr_btn)
            appr_btn.clicked.connect(lambda checked, a=action, f=frame: self.resolve_action(a, f, True))
            
            deny_btn = QPushButton("Deny")
            deny_btn.setProperty("class", "deny-btn")
            deny_btn.style().unpolish(deny_btn)
            deny_btn.style().polish(deny_btn)
            deny_btn.clicked.connect(lambda checked, a=action, f=frame: self.resolve_action(a, f, False))
            
            btn_layout.addWidget(appr_btn)
            btn_layout.addWidget(deny_btn)
            
            layout.addLayout(btn_layout)
            self.queue_vbox.addWidget(frame)
            
    def resolve_action(self, action, frame, approved):
        frame.setParent(None) # Remove from UI
        self.agent_worker.resolve_batch_action(action['name'], action['args'], approved)
        
        # Check if all resolved
        self.pending_actions = [a for a in self.pending_actions if a['id'] != action['id']]
        if not self.pending_actions:
            self.queue_vbox.addWidget(self.no_actions_label)
            self.agent_worker.finalize_batch()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = ENMAMainWindow()
    window.show()
    sys.exit(app.exec())
