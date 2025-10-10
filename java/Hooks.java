// src/test/java/hooks/Hooks.java
package hooks;

import io.cucumber.java.Before;
import io.cucumber.java.After;
import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import pages.GooglePage;

public class Hooks {
    public static WebDriver driver;
    public static GooglePage googlePage;

    @Before
    public void setUp() {
        WebDriverManager.chromedriver().setup(); // ← No chromedriver.exe needed!
        driver = new ChromeDriver();
        googlePage = new GooglePage(driver);
    }

    @After
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}