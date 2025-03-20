curl -X POST 'https://content.twilio.com/v1/Content' \
-H 'Content-Type: application/json' \
-u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN \
-d '{
  "friendly_name": "rcs_test_menu",
  "language": "en",
  "variables": {},
  "types": {
    "twilio/list-picker": {
      "body": "What would you like? The options are:\n- Coffee\n- Espresso\n- Cappuccino\n- Flat White\n- Caffè Latte",
      "button": "More Details",
      "items": [
        {
          "id": "Coffee",
          "item": "Coffee",
          "description": "Brewed coffee, black",
          "media_url": "https://mobert.ngrok.io/resources/menu-items/coffee.png"
        },
        {
          "id": "Espresso",
          "item": "Espresso",
          "description": "Strong black coffee",
          "media_url": "https://mobert.ngrok.io/resources/menu-items/espresso.png"
        },
        {
          "id": "Cappuccino",
          "item": "Cappuccino",
          "description": "Espresso with steamed milk",
          "media_url": "https://mobert.ngrok.io/resources/menu-items/cappuccino.png"
        },
        {
          "id": "Flat White",
          "item": "Flat White",
          "description": "Espresso with velvety milk",
          "media_url": "https://mobert.ngrok.io/resources/menu-items/flat-white.png"
        },
        {
          "id": "Caffè Latte",
          "item": "Caffè Latte",
          "description": "Espresso with steamed milk",
          "media_url": "https://mobert.ngrok.io/resources/menu-items/latte.png"
        }
      ],
      "multiple_selection": null
    },
    "twilio/carousel": {
      "body": "not visible",
      "cards": [
        {
          "title": "Coffee - Brewed coffee, black",
          "body": "",
          "media": "https://mobert.ngrok.io/resources/menu-items/coffee.png",
          "actions": [
            {
              "type": "QUICK_REPLY",
              "title": "Coffee",
              "id": "Coffee"
            }
          ]
        },
        {
          "title": "Espresso - Strong black coffee",
          "body": "",
          "media": "https://mobert.ngrok.io/resources/menu-items/espresso.png",
          "actions": [
            {
              "type": "QUICK_REPLY",
              "title": "Espresso",
              "id": "Espresso"
            }
          ]
        },
        {
          "title": "Cappuccino - Espresso with steamed milk",
          "body": "",
          "media": "https://mobert.ngrok.io/resources/menu-items/cappuccino.png",
          "actions": [
            {
              "type": "QUICK_REPLY",
              "title": "Cappuccino",
              "id": "Cappuccino"
            }
          ]
        },
        {
          "title": "Flat White - Espresso with velvety milk",
          "body": "",
          "media": "https://mobert.ngrok.io/resources/menu-items/flat-white.png",
          "actions": [
            {
              "type": "QUICK_REPLY",
              "title": "Flat White",
              "id": "Flat White"
            }
          ]
        },
        {
          "title": "Caffè Latte - Espresso with steamed milk",
          "body": "",
          "media": "https://mobert.ngrok.io/resources/menu-items/latte.png",
          "actions": [
            {
              "type": "QUICK_REPLY",
              "title": "Caffè Latte",
              "id": "Caffè Latte"
            }
          ]
        }
      ]
    },
    "twilio/text": {
      "body": "What would you like? The options are:\n- Coffee\n- Espresso\n- Cappuccino\n- Flat White\n- Caffè Latte"
    }
  }
}
'