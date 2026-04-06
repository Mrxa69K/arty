#!/usr/bin/env python3

"""
React Native Mobile App Structure Validator
Tests the Artydrop mobile app for syntax, structure, and dependencies.
"""

import os
import json
import subprocess
import sys
from pathlib import Path

class MobileAppTester:
    def __init__(self, mobile_dir="/app/mobile"):
        self.mobile_dir = Path(mobile_dir)
        self.tests_run = 0
        self.tests_passed = 0
        self.issues = []

    def log_test(self, name, success, details=None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name}")
            if details:
                self.issues.append(f"{name}: {details}")

    def test_project_structure(self):
        """Test basic project structure"""
        required_files = [
            "package.json",
            "app.json", 
            "App.js",
            "index.js",
            "src/config/supabase.js",
            "src/config/theme.js",
            "src/config/stripe.js",
            "src/contexts/AuthContext.js",
            "src/navigation/AppNavigator.js",
            "src/utils/constants.js"
        ]
        
        missing_files = []
        for file in required_files:
            file_path = self.mobile_dir / file
            if not file_path.exists():
                missing_files.append(file)
        
        success = len(missing_files) == 0
        details = f"Missing files: {missing_files}" if missing_files else None
        self.log_test("Project structure complete", success, details)
        
    def test_package_json(self):
        """Validate package.json dependencies"""
        package_path = self.mobile_dir / "package.json"
        if not package_path.exists():
            self.log_test("package.json exists", False, "File not found")
            return
            
        try:
            with open(package_path, 'r') as f:
                package = json.load(f)
            
            required_deps = [
                "@expo/vector-icons", "@react-navigation/native", 
                "@react-navigation/native-stack", "@react-navigation/bottom-tabs",
                "@supabase/supabase-js", "@stripe/stripe-react-native", 
                "expo", "react", "react-native", "react-native-safe-area-context"
            ]
            
            missing = [dep for dep in required_deps if dep not in package.get('dependencies', {})]
            success = len(missing) == 0
            details = f"Missing dependencies: {missing}" if missing else None
            self.log_test("package.json has required dependencies", success, details)
            
        except json.JSONDecodeError:
            self.log_test("package.json valid JSON", False, "Invalid JSON")

    def test_configuration_files(self):
        """Test configuration files parse correctly"""
        config_files = {
            "src/config/theme.js": "Theme configuration", 
            "src/utils/constants.js": "Constants file"
        }
        
        for file, description in config_files.items():
            file_path = self.mobile_dir / file
            if file_path.exists():
                try:
                    # Use Node.js to check if file can be required
                    result = subprocess.run(
                        ["node", "-e", f"require('./{file}')"],
                        cwd=self.mobile_dir, 
                        capture_output=True, 
                        text=True, 
                        timeout=10
                    )
                    success = result.returncode == 0
                    details = result.stderr if not success else None
                    self.log_test(f"{description} parses correctly", success, details)
                except subprocess.TimeoutExpired:
                    self.log_test(f"{description} parses correctly", False, "Timeout")
                except Exception as e:
                    self.log_test(f"{description} parses correctly", False, str(e))
            else:
                self.log_test(f"{description} exists", False, "File not found")

    def test_navigation_structure(self):
        """Verify navigation structure is complete"""
        nav_files = [
            "src/navigation/AppNavigator.js",
            "src/navigation/AuthNavigator.js", 
            "src/navigation/PhotographerNavigator.js",
            "src/navigation/ClientNavigator.js"
        ]
        
        missing = [f for f in nav_files if not (self.mobile_dir / f).exists()]
        success = len(missing) == 0
        details = f"Missing navigation files: {missing}" if missing else None
        self.log_test("Navigation structure complete", success, details)

    def test_screen_files(self):
        """Check that referenced screens exist"""
        required_screens = [
            "src/screens/auth/LoginScreen.js",
            "src/screens/auth/SignupScreen.js", 
            "src/screens/auth/ForgotPasswordScreen.js",
            "src/screens/photographer/DashboardScreen.js",
            "src/screens/photographer/GalleriesScreen.js",
            "src/screens/photographer/GalleryDetailScreen.js",
            "src/screens/client/ClientDashboardScreen.js",
            "src/screens/client/ClientGalleryScreen.js",
            "src/screens/shared/PlansScreen.js"
        ]
        
        missing = [s for s in required_screens if not (self.mobile_dir / s).exists()]
        success = len(missing) == 0
        details = f"Missing screens: {missing}" if missing else None
        self.log_test("Required screens exist", success, details)

    def test_ui_components(self):
        """Check UI components exist"""
        ui_components = [
            "src/components/ui/Button.js",
            "src/components/ui/Input.js",
            "src/components/ui/Card.js", 
            "src/components/ui/Badge.js",
            "src/components/GalleryCard.js"
        ]
        
        missing = [c for c in ui_components if not (self.mobile_dir / c).exists()]
        success = len(missing) == 0
        details = f"Missing components: {missing}" if missing else None
        self.log_test("UI components exist", success, details)

    def test_dependencies_installed(self):
        """Check if node_modules exists"""
        node_modules = self.mobile_dir / "node_modules"
        success = node_modules.exists() and node_modules.is_dir()
        details = "node_modules directory not found" if not success else None
        self.log_test("Dependencies installed", success, details)

    def run_all_tests(self):
        """Run all tests"""
        print("🧪 Testing React Native Mobile App Structure...")
        print("=" * 60)
        
        self.test_project_structure()
        self.test_package_json()
        self.test_configuration_files() 
        self.test_navigation_structure()
        self.test_screen_files()
        self.test_ui_components()
        self.test_dependencies_installed()
        
        print("\n" + "=" * 60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        
        if self.issues:
            print("\n❌ Issues found:")
            for issue in self.issues:
                print(f"  • {issue}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MobileAppTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())