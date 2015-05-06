Feature: Author a Website

  As a web page author
  I want to set the heading of my page
  So that I can create the simplest website in the world

  Scenario: Author using the Meteor settings file1
    Given I have authored the site title as "My Test Title"
    When  I navigate to "/"
    Then  I should see the heading "My Test Title"

  @dev
  Scenario: Author using the Meteor settings file2
    Given I have authored the site title as "My Test Title"
    When  I navigate to "/"
    Then  I should see the heading "My Test Title"

  @ignore
  Scenario: Author using the Meteor settings file3
    Given I have authored the site title as "My Test Title"
    When  I navigate to "/"
    Then  I should see the heading "My Test Title"
