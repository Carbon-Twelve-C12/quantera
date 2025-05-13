#!/bin/bash

# Create the directory if it doesn't exist
mkdir -p public/images

# Treasury assets - better images
# T-Bill - Treasury Bill image (short-term treasury security)
curl -L -o public/images/treasury-tbill.jpg "https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?w=800&h=600&auto=compress&cs=tinysrgb"

# T-Note - Treasury Note image (medium-term treasury security)
curl -L -o public/images/treasury-tnote.jpg "https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?w=800&h=600&auto=compress&cs=tinysrgb"

# T-Bond - Treasury Bond image (long-term treasury security)
curl -L -o public/images/treasury-tbond.jpg "https://images.pexels.com/photos/4386476/pexels-photo-4386476.jpeg?w=800&h=600&auto=compress&cs=tinysrgb"

# Money Market - Money Market Fund image
curl -L -o public/images/treasury-moneymarket.jpg "https://images.pexels.com/photos/4483608/pexels-photo-4483608.jpeg?w=800&h=600&auto=compress&cs=tinysrgb"

# Environmental assets
mkdir -p public/images/treasuries

# Amazon Rainforest - Carbon Credit project in Amazon rainforest
curl -L -o public/images/treasuries/amazon-rainforest.jpg "https://images.pexels.com/photos/904789/pexels-photo-904789.jpeg?w=800&h=600&auto=compress&cs=tinysrgb"

# Mangrove Restoration - Biodiversity Credit project for mangrove restoration
curl -L -o public/images/treasuries/mangrove-restoration.jpg "https://images.pexels.com/photos/1122408/pexels-photo-1122408.jpeg?w=800&h=600&auto=compress&cs=tinysrgb"

# Highland Watershed - Water Credit project for watershed protection
curl -L -o public/images/treasuries/highland-watershed.jpg "https://images.pexels.com/photos/2088205/pexels-photo-2088205.jpeg?w=800&h=600&auto=compress&cs=tinysrgb"

# Moroccan Solar - Renewable Energy project for solar thermal power
curl -L -o public/images/treasuries/morocco-solar.jpg "https://images.pexels.com/photos/356036/pexels-photo-356036.jpeg?w=800&h=600&auto=compress&cs=tinysrgb"

echo "Asset images downloaded successfully!" 