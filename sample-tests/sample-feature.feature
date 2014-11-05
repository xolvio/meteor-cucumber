Feature: Shopping Basket

  As a customer of this book store
  I want to add items to my basket
  So that I can purchase and receive them

  Scenario: User can see an order summary when they check out
    Given I have added an item to my basket
    When When I click checkout
    Then I should see a summary of my order
    And I should see a pay button