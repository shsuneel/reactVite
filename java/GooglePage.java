// src/test/java/pages/GooglePage.java
package pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;

public class GooglePage {
    private WebDriver driver;
    private WebDriverWait wait;

    // Google search input field (name='q' is reliable)
    private By searchBox = By.name("q");

    public GooglePage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, 10);
    }

    /**
     * Perform a search on Google
     * @param query the search term
     */
    public void search(String query) {
        WebElement searchField = wait.until(ExpectedConditions.visibilityOfElementLocated(searchBox));
        searchField.sendKeys(query);
        searchField.submit(); // Submits the form (same as pressing Enter)
    }
}